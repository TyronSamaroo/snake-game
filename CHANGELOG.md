# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Fixed
- CORS configuration in backend
  - Added support for Vite's default port (5173)
  - Added 'Accept' header to allowed headers
  - Updated allowed origins to support both development ports
  ```go
  AllowedOrigins: []string{"http://localhost:5173", "http://localhost:3000"}
  ```

- HTTP Methods Support
  - Added explicit support for both GET and POST methods on `/leaderboard` endpoint
  - Fixed 405 Method Not Allowed errors
  - Properly configured OPTIONS preflight handling

- Frontend Score Submission
  - Improved error handling in score submission logic
  - Added proper request headers and body formatting
  - Enhanced error feedback to users

- Game Reset Functionality
  - Fixed "Play Again" not properly resetting game state
  - Added proper state cleanup on game restart
  - Ensured new game starts with fresh state

- Score Submission Flow
  - Fixed score always showing as 0
  - Improved game over state handling
  - Added proper state management for name input and leaderboard display
  - Added debug logging for score submission

### Added
- Detailed logging in backend for better debugging
  - Added request logging for incoming requests
  - Added detailed logging for score submissions
  - Added logging for leaderboard operations
- Dependencies
  - Added `github.com/rs/cors` package for CORS handling
  ```bash
  go get github.com/rs/cors
  ```

### Changed
- Refactored CORS middleware implementation
  - Replaced custom CORS implementation with `rs/cors` package
  - Simplified middleware configuration
  - Improved security by explicitly defining allowed origins

### Technical Details
- Backend Changes (`backend/game-service/main.go`):
  ```go
  router.Use(cors.New(cors.Options{
      AllowedOrigins:   []string{"http://localhost:5173", "http://localhost:3000"},
      AllowedMethods:   []string{"GET", "POST", "OPTIONS"},
      AllowedHeaders:   []string{"Content-Type", "Accept"},
      AllowCredentials: true,
  }).Handler)
  ```

- Frontend Changes (`frontend/src/components/Game.tsx`):
  ```typescript
  const submitScore = async (score: number) => {
      try {
          const response = await fetch('http://localhost:8080/leaderboard', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify({ score }),
          });
          // ... error handling
      } catch (error) {
          console.error('Error submitting score:', error);
      }
  };
  ```

## [Future Improvements]
- Add rate limiting to prevent API abuse
- Implement user authentication
- Add input validation for score submissions
- Enhance error messages for better user feedback 