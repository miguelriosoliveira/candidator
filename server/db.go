package main

import (
	"database/sql"
	_ "embed"
	"encoding/json"
	"errors"
	"fmt"
	"path/filepath"
	"strings"

	_ "modernc.org/sqlite"
)

//go:generate go run ./tools/generate-data

//go:embed data.json
var rawData []byte

type Candidate struct {
	ID        int      `json:"id"`
	FirstName string   `json:"first_name"`
	LastName  string   `json:"last_name"`
	Email     string   `json:"email"`
	Phone     string   `json:"phone"`
	Picture   string   `json:"picture"`
	Skills    []string `json:"skills"`
}

// Database persists candidates with SQLite using a pure-Go driver.
type Database struct {
	sql *sql.DB
}

// OpenSQLite opens (or creates) a SQLite file with schema and seeds from embedded data.json when empty.
func OpenSQLite(path string) (*Database, error) {
	path = filepath.Clean(path)
	dsn := "file:" + filepath.ToSlash(path)

	sqlDB, err := sql.Open("sqlite", dsn)
	if err != nil {
		return nil, fmt.Errorf("sqlite open: %w", err)
	}
	sqlDB.SetMaxOpenConns(1)
	if _, err := sqlDB.Exec(`PRAGMA busy_timeout = 5000`); err != nil {
		_ = sqlDB.Close()
		return nil, fmt.Errorf("sqlite pragma busy_timeout: %w", err)
	}
	if _, err := sqlDB.Exec(`PRAGMA foreign_keys = ON`); err != nil {
		_ = sqlDB.Close()
		return nil, fmt.Errorf("sqlite pragma foreign_keys: %w", err)
	}
	if err := sqlDB.Ping(); err != nil {
		_ = sqlDB.Close()
		return nil, fmt.Errorf("sqlite ping: %w", err)
	}

	db := &Database{sql: sqlDB}

	if _, err := db.sql.Exec(`
CREATE TABLE IF NOT EXISTS candidates (
	id INTEGER PRIMARY KEY,
	first_name TEXT NOT NULL,
	last_name TEXT NOT NULL,
	email TEXT NOT NULL UNIQUE,
	phone TEXT NOT NULL,
	picture TEXT NOT NULL,
	skills TEXT NOT NULL DEFAULT '[]'
);`); err != nil {
		_ = db.Close()
		return nil, fmt.Errorf("sqlite migrate: %w", err)
	}

	if err := db.seedEmbeddedIfEmpty(); err != nil {
		_ = db.Close()
		return nil, err
	}

	return db, nil
}

// Close closes the SQLite connection pool.
func (db *Database) Close() error {
	if db == nil || db.sql == nil {
		return nil
	}
	return db.sql.Close()
}

func marshalSkills(skills []string) ([]byte, error) {
	s := skills
	if s == nil {
		s = []string{}
	}
	return json.Marshal(s)
}

// All returns candidates ordered by ascending id (stable paging).
func (db *Database) All() []*Candidate {
	rows, err := db.sql.Query(`
SELECT id, first_name, last_name, email, phone, picture, skills FROM candidates ORDER BY id ASC`)
	if err != nil {
		return []*Candidate{}
	}
	defer rows.Close()

	var result []*Candidate
	for rows.Next() {
		var c Candidate
		var skillsJSON []byte

		if err := rows.Scan(&c.ID, &c.FirstName, &c.LastName, &c.Email, &c.Phone, &c.Picture, &skillsJSON); err != nil {
			return []*Candidate{}
		}
		if err := json.Unmarshal(skillsJSON, &c.Skills); err != nil {
			return []*Candidate{}
		}
		if c.Skills == nil {
			c.Skills = []string{}
		}
		result = append(result, &c)
	}
	return result
}

var ErrNotFound = errors.New("not found")

// Create inserts candidate and assigns c.ID from the inserted primary key.
func (db *Database) Create(c *Candidate) error {
	if c == nil {
		return fmt.Errorf("nil candidate")
	}
	skillsJSON, err := marshalSkills(c.Skills)
	if err != nil {
		return err
	}

	res, err := db.sql.Exec(`
INSERT INTO candidates (first_name, last_name, email, phone, picture, skills)
VALUES (?,?,?,?,?,?)`,
		c.FirstName, c.LastName, c.Email, c.Phone, c.Picture, skillsJSON)
	if err != nil {
		return fmt.Errorf("insert candidate: %w", err)
	}

	id, err := res.LastInsertId()
	if err != nil {
		return fmt.Errorf("last insert id: %w", err)
	}
	c.ID = int(id)
	return nil
}

func (db *Database) Update(updated *Candidate) error {
	if updated == nil {
		return fmt.Errorf("nil candidate")
	}
	skillsJSON, err := marshalSkills(updated.Skills)
	if err != nil {
		return err
	}

	res, err := db.sql.Exec(`
UPDATE candidates SET first_name = ?, last_name = ?, email = ?, phone = ?, picture = ?, skills = ?
WHERE id = ?`,
		updated.FirstName, updated.LastName, updated.Email, updated.Phone,
		updated.Picture, skillsJSON, updated.ID,
	)
	if err != nil {
		return fmt.Errorf("update candidate: %w", err)
	}

	n, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if n == 0 {
		return ErrNotFound
	}
	return nil
}

func (db *Database) FindByID(id int) (*Candidate, error) {
	row := db.sql.QueryRow(`
SELECT id, first_name, last_name, email, phone, picture, skills FROM candidates WHERE id = ?`, id)

	var c Candidate
	var skillsJSON []byte

	if err := row.Scan(&c.ID, &c.FirstName, &c.LastName, &c.Email, &c.Phone, &c.Picture, &skillsJSON); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	if err := json.Unmarshal(skillsJSON, &c.Skills); err != nil {
		return nil, err
	}
	if c.Skills == nil {
		c.Skills = []string{}
	}

	return &c, nil
}

func (db *Database) FindByEmail(email string) (*Candidate, error) {
	row := db.sql.QueryRow(`
SELECT id, first_name, last_name, email, phone, picture, skills FROM candidates WHERE email = ?`, email)

	var c Candidate
	var skillsJSON []byte

	if err := row.Scan(&c.ID, &c.FirstName, &c.LastName, &c.Email, &c.Phone, &c.Picture, &skillsJSON); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}

	if err := json.Unmarshal(skillsJSON, &c.Skills); err != nil {
		return nil, err
	}
	if c.Skills == nil {
		c.Skills = []string{}
	}

	return &c, nil
}

func (db *Database) candidateCount() (int, error) {
	var n int
	if err := db.sql.QueryRow(`SELECT COUNT(*) FROM candidates`).Scan(&n); err != nil {
		return 0, err
	}
	return n, nil
}

func (db *Database) seedEmbeddedIfEmpty() error {
	n, err := db.candidateCount()
	if err != nil || n > 0 {
		return err
	}

	var seed []*Candidate
	if err := json.Unmarshal(rawData, &seed); err != nil {
		return fmt.Errorf("unmarshal embedded seed data: %w", err)
	}

	tx, err := db.sql.Begin()
	if err != nil {
		return err
	}
	defer func() { _ = tx.Rollback() }()

	stmt, err := tx.Prepare(`
INSERT INTO candidates (id, first_name, last_name, email, phone, picture, skills)
VALUES (?,?,?,?,?,?,?)`)
	if err != nil {
		return err
	}
	defer stmt.Close()

	for _, obj := range seed {
		id := obj.ID
		if id <= 0 {
			return fmt.Errorf("seed candidate invalid id=%d", id)
		}

		skillsJSON, err := marshalSkills(obj.Skills)
		if err != nil {
			return err
		}

		if _, err := stmt.Exec(
			id,
			obj.FirstName,
			obj.LastName,
			strings.TrimSpace(obj.Email),
			obj.Phone,
			obj.Picture,
			skillsJSON,
		); err != nil {
			return fmt.Errorf("seed insert id=%d: %w", id, err)
		}
	}

	return tx.Commit()
}
