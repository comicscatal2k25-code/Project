#!/bin/bash

# Shopify Integration Migration Script
# Usage: ./migrate.sh [up|down]

set -e

# Configuration
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-postgres}
DB_USER=${DB_USER:-postgres}

# Migration files
UP_MIGRATION="scripts/103_create_shopify_tables.sql"
DOWN_MIGRATION="scripts/104_drop_shopify_tables.sql"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if psql is available
    if ! command -v psql &> /dev/null; then
        log_error "psql command not found. Please install PostgreSQL client."
        exit 1
    fi
    
    # Check if migration files exist
    if [ ! -f "$UP_MIGRATION" ]; then
        log_error "Up migration file not found: $UP_MIGRATION"
        exit 1
    fi
    
    if [ ! -f "$DOWN_MIGRATION" ]; then
        log_error "Down migration file not found: $DOWN_MIGRATION"
        exit 1
    fi
    
    log_info "Prerequisites check passed"
}

run_migration() {
    local migration_file=$1
    local direction=$2
    
    log_info "Running $direction migration: $migration_file"
    
    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$migration_file"; then
        log_info "$direction migration completed successfully"
    else
        log_error "$direction migration failed"
        exit 1
    fi
}

create_storage_buckets() {
    log_info "Creating Supabase storage buckets..."
    
    # Create storage buckets for Shopify integration
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" << EOF
-- Create storage buckets for Shopify integration
INSERT INTO storage.buckets (id, name, public) VALUES 
('shopify_images', 'shopify_images', true),
('shopify_exports', 'shopify_exports', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies
CREATE POLICY "Public read access for shopify_images" ON storage.objects
FOR SELECT USING (bucket_id = 'shopify_images');

CREATE POLICY "Public read access for shopify_exports" ON storage.objects
FOR SELECT USING (bucket_id = 'shopify_exports');

CREATE POLICY "Authenticated users can upload to shopify_images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'shopify_images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can upload to shopify_exports" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'shopify_exports' AND auth.role() = 'authenticated');
EOF
    
    log_info "Storage buckets created successfully"
}

drop_storage_buckets() {
    log_info "Dropping Supabase storage buckets..."
    
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" << EOF
-- Drop storage policies
DROP POLICY IF EXISTS "Public read access for shopify_images" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for shopify_exports" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload to shopify_images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload to shopify_exports" ON storage.objects;

-- Drop storage buckets
DELETE FROM storage.buckets WHERE id IN ('shopify_images', 'shopify_exports');
EOF
    
    log_info "Storage buckets dropped successfully"
}

show_usage() {
    echo "Usage: $0 [up|down]"
    echo ""
    echo "Commands:"
    echo "  up    - Apply Shopify integration migrations"
    echo "  down  - Rollback Shopify integration migrations"
    echo ""
    echo "Environment variables:"
    echo "  DB_HOST    - Database host (default: localhost)"
    echo "  DB_PORT    - Database port (default: 5432)"
    echo "  DB_NAME    - Database name (default: postgres)"
    echo "  DB_USER    - Database user (default: postgres)"
    echo ""
    echo "Examples:"
    echo "  $0 up"
    echo "  DB_HOST=prod-db.example.com $0 up"
    echo "  $0 down"
}

# Main script
main() {
    if [ $# -eq 0 ]; then
        show_usage
        exit 1
    fi
    
    local command=$1
    
    case $command in
        up)
            log_info "Starting Shopify integration migration (UP)"
            check_prerequisites
            run_migration "$UP_MIGRATION" "UP"
            create_storage_buckets
            log_info "Shopify integration migration completed successfully!"
            log_warn "Don't forget to:"
            log_warn "1. Set FEATURE_SHOPIFY=true in your environment"
            log_warn "2. Configure Shopify API credentials"
            log_warn "3. Restart your application"
            ;;
        down)
            log_info "Starting Shopify integration migration (DOWN)"
            check_prerequisites
            drop_storage_buckets
            run_migration "$DOWN_MIGRATION" "DOWN"
            log_info "Shopify integration migration rolled back successfully!"
            log_warn "Don't forget to:"
            log_warn "1. Set FEATURE_SHOPIFY=false in your environment"
            log_warn "2. Restart your application"
            ;;
        *)
            log_error "Unknown command: $command"
            show_usage
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
