//go:build !windows

package main

func startDetached(string) error { return nil }
