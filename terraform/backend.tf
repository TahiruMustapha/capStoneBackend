# Terraform Backend Configuration Template
# 
# CRITICAL: You MUST configure a remote backend for this setup to work properly.
# Without a remote backend, Terraform state is lost after GitHub Actions workflows complete,
# making destroy operations impossible.
#
# SETUP INSTRUCTIONS:
# 
# 1. Create an S3 bucket for Terraform state:
#    aws s3api create-bucket \
#      --bucket capstone-terraform-state-<your-unique-suffix> \
#      --region us-east-1
#
# 2. Enable versioning on the bucket:
#    aws s3api put-bucket-versioning \
#      --bucket capstone-terraform-state-<your-unique-suffix> \
#      --versioning-configuration Status=Enabled
#
# 3. Create a DynamoDB table for state locking:
#    aws dynamodb create-table \
#      --table-name capstone-terraform-locks \
#      --attribute-definitions AttributeName=LockID,AttributeType=S \
#      --key-schema AttributeName=LockID,KeyType=HASH \
#      --billing-mode PAY_PER_REQUEST \
#      --region us-east-1
#
# 4. Uncomment the backend configuration below and update the bucket name
# 5. Run `terraform init -migrate-state` to migrate existing state to S3
#
# AFTER SETUP: Uncomment the backend block below

terraform {
  backend "s3" {
    bucket         = "capstone-terraform-state-b"
    key            = "capstone/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "capstone-terraform-locks"
  }
}
