package bridge

import "testing"

func TestSplitServer(t *testing.T) {
	tests := []struct {
		server, name, port string
	}{
		{"127.0.0.1:20122", "127.0.0.1", "20122"},
		{"localhost:20122", "localhost", "20122"},
		{"[::1]:20122", "::1", "20122"},
		{"[fd00::1]:7890", "fd00::1", "7890"},
		{"127.0.0.1", "127.0.0.1", ""},
	}
	for _, tt := range tests {
		name, port := splitServer(tt.server)
		if name != tt.name || port != tt.port {
			t.Errorf("splitServer(%q) = %q, %q; want %q, %q", tt.server, name, port, tt.name, tt.port)
		}
	}
}
