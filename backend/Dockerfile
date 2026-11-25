FROM golang:1.27-alpine AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /catetkos .

FROM alpine:3.22
RUN apk add --no-cache ca-certificates tzdata wget && adduser -D -u 1000 app
WORKDIR /app
COPY --from=build /catetkos /app/catetkos
COPY seed/example /app/seed/example
USER app
ENV PORT=8080
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s CMD wget -qO- http://127.0.0.1:8080/api/status || exit 1
CMD ["/app/catetkos", "serve"]
