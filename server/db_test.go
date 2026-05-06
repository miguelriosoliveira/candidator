package main

import (
	"encoding/json"
	"path/filepath"
	"testing"
)

func embeddedCandidateCount(t *testing.T) int {
	t.Helper()
	var list []Candidate
	if err := json.Unmarshal(rawData, &list); err != nil {
		t.Fatal(err)
	}
	return len(list)
}

func TestOpenSQLiteDB_SeedsWhenEmptyOnce(t *testing.T) {
	path := filepath.Join(t.TempDir(), "candidator.db")
	db1, err := OpenSQLite(path)
	if err != nil {
		t.Fatal(err)
	}
	got := db1.All()
	want := embeddedCandidateCount(t)
	if len(got) != want {
		t.Fatalf("after seed expected %d rows, got %d", want, len(got))
	}
	db1.Close()

	db2, err := OpenSQLite(path)
	if err != nil {
		t.Fatal(err)
	}
	defer db2.Close()
	got2 := db2.All()
	if len(got2) != len(got) {
		t.Fatalf("re-open should not re-seed: got %d want %d", len(got2), len(got))
	}
}

func TestSQLite_Create_Find_Update_PersistAcrossReopen(t *testing.T) {
	path := filepath.Join(t.TempDir(), "persist.db")

	db1, err := OpenSQLite(path)
	if err != nil {
		t.Fatal(err)
	}
	newCand := &Candidate{
		FirstName: "Zoe",
		LastName:  "Unit",
		Email:     "zoe-unit-test@example.com",
		Phone:     "123",
		Picture:   "data:image/png;base64,AA",
		Skills:    []string{"SQLite"},
	}

	if err := db1.Create(newCand); err != nil {
		t.Fatal(err)
	}
	if newCand.ID == 0 {
		t.Fatal("expected Create to set candidate ID")
	}
	found, err := db1.FindByID(newCand.ID)
	if err != nil {
		t.Fatal(err)
	}
	if found.Email != newCand.Email {
		t.Fatalf("FindByID email = %q, want %q", found.Email, newCand.Email)
	}
	if _, err := db1.FindByEmail(newCand.Email); err != nil {
		t.Fatal(err)
	}

	updated := &Candidate{
		ID:        newCand.ID,
		FirstName: "Zoe",
		LastName:  "Updated",
		Email:     newCand.Email,
		Phone:     "456",
		Picture:   "data:image/png;base64,BB",
		Skills:    []string{"Go"},
	}
	if err := db1.Update(updated); err != nil {
		t.Fatal(err)
	}

	db1.Close()

	db2, err := OpenSQLite(path)
	if err != nil {
		t.Fatal(err)
	}
	defer db2.Close()

	again, err := db2.FindByID(newCand.ID)
	if err != nil {
		t.Fatal(err)
	}
	if again.LastName != "Updated" || again.Phone != "456" {
		t.Fatalf("persisted candidate = %+v", again)
	}
	if len(again.Skills) != 1 || again.Skills[0] != "Go" {
		t.Fatalf("skills = %+v", again.Skills)
	}

	if _, err := db2.FindByID(999_999); err != ErrNotFound {
		t.Fatalf("expected ErrNotFound, got %v", err)
	}
}
