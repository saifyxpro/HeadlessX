package main

import (
	"encoding/json"
	"io"
	"log/slog"
	"net/http"
	"time"
)

const maxRequestSize = 150 * 1024 * 1024

type Handler struct {
	converter *Converter
	logger    *slog.Logger
}

type ConvertRequest struct {
	HTML string `json:"html"`
}

type ConvertResponse struct {
	Markdown string `json:"markdown"`
	Success  bool   `json:"success"`
}

type ErrorResponse struct {
	Error   string `json:"error"`
	Details string `json:"details,omitempty"`
	Success bool   `json:"success"`
}

func NewHandler(converter *Converter, logger *slog.Logger) *Handler {
	return &Handler{
		converter: converter,
		logger:    logger,
	}
}

func (h *Handler) RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("/", h.Index)
	mux.HandleFunc("/health", h.HealthCheck)
	mux.HandleFunc("/convert", h.ConvertHTML)
}

func (h *Handler) Index(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]any{
		"service":     "HeadlessX HTML to Markdown",
		"version":     "1.0.0",
		"description": "Firecrawl-style HTML to Markdown conversion service",
		"endpoints": []string{
			"GET /health",
			"POST /convert",
		},
	})
}

func (h *Handler) HealthCheck(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]any{
		"status":    "healthy",
		"service":   "headlessx-html-to-markdown",
		"timestamp": time.Now().UTC(),
	})
}

func (h *Handler) ConvertHTML(w http.ResponseWriter, r *http.Request) {
	startedAt := time.Now()
	r.Body = http.MaxBytesReader(w, r.Body, maxRequestSize)

	body, err := io.ReadAll(r.Body)
	if err != nil {
		h.writeError(w, http.StatusBadRequest, "Failed to read request body", err)
		return
	}

	var request ConvertRequest
	if err := json.Unmarshal(body, &request); err != nil {
		h.writeError(w, http.StatusBadRequest, "Invalid JSON payload", err)
		return
	}

	if request.HTML == "" {
		writeJSON(w, http.StatusBadRequest, ErrorResponse{
			Error:   "HTML field is required",
			Details: "The 'html' field cannot be empty",
			Success: false,
		})
		return
	}

	markdown, err := h.converter.ConvertHTMLToMarkdown(request.HTML)
	if err != nil {
		h.writeError(w, http.StatusInternalServerError, "Conversion failed", err)
		return
	}

	h.logger.Info("HTML converted to markdown",
		"duration_ms", time.Since(startedAt).Milliseconds(),
		"input_size", len(request.HTML),
		"output_size", len(markdown),
	)

	writeJSON(w, http.StatusOK, ConvertResponse{
		Markdown: markdown,
		Success:  true,
	})
}

func (h *Handler) writeError(w http.ResponseWriter, statusCode int, message string, err error) {
	h.logger.Error(message, "error", err)
	writeJSON(w, statusCode, ErrorResponse{
		Error:   message,
		Details: err.Error(),
		Success: false,
	})
}

func writeJSON(w http.ResponseWriter, statusCode int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	_ = json.NewEncoder(w).Encode(payload)
}
