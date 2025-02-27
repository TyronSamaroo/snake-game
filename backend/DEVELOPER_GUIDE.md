# 🚀 Snake Game Backend Developer Guide

> Quick-start guide for new developers working on the Snake Game backend

## 🔍 Overview

This is a quick reference guide for developers who are new to the Snake Game backend. It provides practical information to help you get started quickly and maintain the service effectively.

## 👨‍💻 Getting Started

### 1. Local Development Setup

```bash
# Clone the repository (if not already done)
git clone <repository-url>
cd snake-game/backend/game-service

# Install dependencies
go mod download

# Start the server
go run main.go
```

The server will start on port 8080 by default.

### 2. Project Structure at a Glance

- `main.go` - Main entry point and core game logic
- `internal/` - Internal packages (not meant to be imported by external projects)
- `pkg/` - Public packages that can be imported by other projects
- `data/` - Static data resources
- `leaderboard.db` - SQLite database for storing leaderboard data

### 3. Code Styles and Conventions

We follow standard Go conventions:

- Use `gofmt` for code formatting
- Follow [Effective Go](https://golang.org/doc/effective_go) guidelines
- Use meaningful variable and function names
- Write clear comments for public functions and types

## 🧪 Development Workflow

### Making Changes

1. Create a new branch for your feature or bug fix
2. Make your changes
3. Write or update tests
4. Run tests with `go test ./...`
5. Submit a pull request

### Common Development Tasks

**Adding a new API endpoint:**

1. Add the route in the `main()` function using the Gorilla mux router
2. Implement the handler function
3. Add appropriate validation and error handling
4. Update the API documentation

**Modifying the game logic:**

1. Game logic is in the `Game` struct methods in `main.go`
2. Be careful when modifying the core game loop (`update()` method)
3. Always ensure collision detection remains accurate
4. Test thoroughly with various game scenarios

**Working with the leaderboard:**

1. The `Leaderboard` struct handles all database interactions
2. Use the existing methods for database operations
3. Don't modify the schema without migration plans

## 🐞 Debugging

### Common Issues and Solutions

1. **WebSocket connection issues**
   - Check CORS configuration
   - Verify client WebSocket implementation
   - Look for connection logs in the server output

2. **Game state inconsistencies**
   - Add debug logging to track state changes
   - Verify the game loop is functioning correctly
   - Check for race conditions in the game state updates

3. **Database problems**
   - Check that SQLite is installed and working
   - Verify file permissions on `leaderboard.db`
   - Use the SQLite CLI for direct database inspection:
     ```
     sqlite3 leaderboard.db
     .tables
     SELECT * FROM leaderboard;
     ```

### Useful Debug Commands

```bash
# Run with verbose logging
go run main.go -v

# Run tests with coverage
go test -cover

# Benchmark performance
go test -bench=.
```

## 📊 Monitoring and Performance

### Key Metrics to Watch

- WebSocket connection count
- Message processing time
- Database query performance
- Memory usage (especially for long-running instances)

### Performance Optimization Tips

1. **WebSocket Communication**
   - Minimize the size of messages sent
   - Consider batching updates if sending too frequently

2. **Game Loop**
   - The game tick interval (GAME_TICK_MS) affects performance
   - Too small: high CPU usage
   - Too large: less responsive gameplay

3. **Database**
   - Leaderboard queries can be cached if they become a bottleneck
   - Consider adding indexes for frequently queried columns

## 📝 Notes for Code Reviewers

When reviewing pull requests, pay attention to:

1. Proper error handling
2. Race conditions in concurrent code
3. Websocket message validation
4. Test coverage of changes
5. Performance impact of changes

## 🔄 Deployment Considerations

### Pre-Deployment Checklist

- [ ] All tests pass
- [ ] No linting issues
- [ ] Performance tested with expected load
- [ ] Database migrations (if needed) are ready
- [ ] Documentation updated

### Deployment Steps

1. Build the binary:
   ```
   go build -o snake-server
   ```

2. Deploy the binary and database to your server

3. Start the server:
   ```
   ./snake-server
   ```

4. Verify the server is running correctly:
   ```
   curl http://localhost:8080/health
   ```

## 📚 Additional Resources

- [Go WebSocket Documentation](https://pkg.go.dev/github.com/gorilla/websocket)
- [SQLite Documentation](https://www.sqlite.org/docs.html)
- [Gorilla Mux Router](https://pkg.go.dev/github.com/gorilla/mux) 