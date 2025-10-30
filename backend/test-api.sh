#!/bin/bash

# Color codes for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:3000"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Testing User Data API${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Test 1: Health Check
echo -e "${GREEN}Test 1: Health Check${NC}"
curl -s $BASE_URL | jq .
echo -e "\n"

# Test 2: Get User 1 (Cache Miss)
echo -e "${GREEN}Test 2: Get User 1 (Cache Miss - ~200ms)${NC}"
curl -s "$BASE_URL/users/1" | jq .
echo -e "\n"

# Test 3: Get User 1 Again (Cache Hit)
echo -e "${GREEN}Test 3: Get User 1 Again (Cache Hit - <5ms)${NC}"
curl -s "$BASE_URL/users/1" | jq .
echo -e "\n"

# Test 4: Get User 2
echo -e "${GREEN}Test 4: Get User 2 (Cache Miss)${NC}"
curl -s "$BASE_URL/users/2" | jq .
echo -e "\n"

# Test 5: Get User 3
echo -e "${GREEN}Test 5: Get User 3 (Cache Miss)${NC}"
curl -s "$BASE_URL/users/3" | jq .
echo -e "\n"

# Test 6: Get Non-Existent User
echo -e "${GREEN}Test 6: Get Non-Existent User (404)${NC}"
curl -s "$BASE_URL/users/999" | jq .
echo -e "\n"

# Test 7: Cache Status
echo -e "${GREEN}Test 7: Cache Status${NC}"
curl -s "$BASE_URL/cache-status" | jq .
echo -e "\n"

# Test 8: Create New User
echo -e "${GREEN}Test 8: Create New User${NC}"
curl -s -X POST "$BASE_URL/users" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com"}' | jq .
echo -e "\n"

# Test 9: Get Newly Created User
echo -e "${GREEN}Test 9: Get Newly Created User (Should be cached)${NC}"
curl -s "$BASE_URL/users/4" | jq .
echo -e "\n"

# Test 10: Cache Status After Operations
echo -e "${GREEN}Test 10: Cache Status After Operations${NC}"
curl -s "$BASE_URL/cache-status" | jq .
echo -e "\n"

# Test 11: Rate Limiting Test
echo -e "${YELLOW}Test 11: Rate Limiting Test (Burst)${NC}"
echo -e "${YELLOW}Sending 6 rapid requests to test burst limit (5 req/10sec)...${NC}"
for i in {1..6}; do
  echo -e "${YELLOW}Request $i:${NC}"
  curl -s "$BASE_URL/users/1" | jq -c '{cached, responseTime, error}'
  sleep 0.5
done
echo -e "\n"

# Test 12: Clear Cache
echo -e "${GREEN}Test 12: Clear Cache${NC}"
curl -s -X DELETE "$BASE_URL/cache" | jq .
echo -e "\n"

# Test 13: Verify Cache Cleared
echo -e "${GREEN}Test 13: Verify Cache Cleared${NC}"
curl -s "$BASE_URL/cache-status" | jq .
echo -e "\n"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}All Tests Completed!${NC}"
echo -e "${BLUE}========================================${NC}"

