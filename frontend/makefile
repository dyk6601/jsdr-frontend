PKG = frontend

# Frontend makefile

NPM = npm
DIR = .git

.PHONY: install dev build preview lint test ci clean

install:
	@echo "Installing frontend dependencies..."
	cd $(DIR) && $(NPM) ci

dev:
	@echo "Starting frontend dev server..."
	cd $(DIR) && $(NPM) run dev

build:
	@echo "Building frontend..."
	cd $(DIR) && $(NPM) run build

preview:
	@echo "Starting preview server..."
	cd $(DIR) && $(NPM) run preview

lint:
	@echo "Running frontend linter..."
	cd $(DIR) && $(NPM) run lint

test:
	@echo "Running frontend tests (if defined)..."
	@cd $(DIR) && \
	if $(NPM) run test --silent >/dev/null 2>&1; then \
		cd $(DIR) && $(NPM) run test; \
	else \
		echo "No 'test' script defined in package.json; skipping tests."; \
	fi

ci: install lint test build
	@echo "CI: install, lint, test (if any), build completed"

clean:
	@echo "Cleaning frontend build artifacts and node_modules..."
	-rm -rf $(DIR)/node_modules
	-rm -rf $(DIR)/dist
	-rm -rf $(DIR)/build
