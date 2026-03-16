FROM golang:1.26-alpine AS builder

WORKDIR /src

COPY apps/go-html-to-md-service/go.mod ./
RUN go mod download

COPY apps/go-html-to-md-service ./
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /out/headlessx-html-to-md-service .

FROM alpine:3.22

RUN adduser -D -u 10001 appuser

COPY --from=builder /out/headlessx-html-to-md-service /usr/local/bin/headlessx-html-to-md-service

EXPOSE 8080

USER appuser

CMD ["headlessx-html-to-md-service"]
