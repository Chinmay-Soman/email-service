# Resilient Email Sending Service

## Overview
This project implements a resilient email sending service in TypeScript. The service utilizes two mock email providers and includes features such as retry logic with exponential backoff, provider fallback, idempotency, rate limiting, status tracking, circuit breaker pattern, simple logging, and a basic queue system.

## Features
- **Retry Mechanism**: Retries failed email sends with exponential backoff.
- **Fallback**: Switches to a secondary provider on failure.
- **Idempotency**:
