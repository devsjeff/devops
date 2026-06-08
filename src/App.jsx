import { useState } from "react";

// ─── THEME COLORS ──────────────────────────────────────────────
const COLORS = {
  linux:     "#00e5a0",
  terraform: "#7b68ee",
  kafka:     "#ff6b35",
  boto3:     "#ffd700",
  networking:"#00bfff",
  cheatsheet:"#ff69b4",
};

// ─── DATA ──────────────────────────────────────────────────────
const DATA = {
  linux: [
    {
      icon: "🗂️",
      title: "File System Basics",
      theory: [
        "Linux organizes everything as files — even devices and processes. The root / is the starting point. Navigate with absolute paths (/home/ubuntu/file.txt) or relative paths (./file.txt).",
        "Key directories: /etc = config files, /var/log = logs, /tmp = temp files, /home = user homes, /usr/bin = programs.",
      ],
      notes: [
        "ls -lah — list all files with human-readable sizes",
        "pwd — print current working directory",
        "cd - — jump back to previous directory",
        "find / -name '*.log' 2>/dev/null — find all log files",
        "du -sh * — disk usage of each folder",
        "df -h — disk free space overview",
      ],
      commands: [
        {
          label: "Navigate & List", tag: "fs",
          code: `cd /var/log          # go to log directory
ls -lah              # list all files (human readable)
tree -L 2            # directory tree 2 levels deep
pwd                  # where am I?
find . -name "*.conf" -type f   # find config files
locate nginx.conf    # fast search (uses index)
du -sh /var/log/*   # size of each log file`,
        },
        {
          label: "Create / Move / Copy", tag: "fs",
          code: `mkdir -p /opt/myapp/config   # create nested dirs
cp -r /src /dst              # copy directory recursively
mv oldname.txt newname.txt   # rename or move
rm -rf /tmp/old_data         # delete (CAREFUL!)
ln -s /opt/myapp current     # symlink current -> myapp
touch newfile.txt            # create empty file`,
        },
      ],
      scenarios: [
        {
          title: "🔍 Find big files eating disk space",
          when: "When df -h shows disk is 90%+ full",
          steps: ["Run df -h to see which partition is full", "Run du -sh /var/log/* to check logs", "Delete old: find /var/log -name '*.log' -mtime +30 -delete"],
          code: `df -h                          # see what's full
du -sh /* 2>/dev/null | sort -rh | head -20
find /var/log -name "*.gz" -delete
journalctl --vacuum-time=7d`,
        },
      ],
    },
    {
      icon: "👤",
      title: "Users & Permissions",
      theory: [
        "Every file has an owner (user + group) and permissions (read/write/execute) for 3 levels: owner, group, others. chmod 755 means owner=rwx (7), group=r-x (5), others=r-x (5).",
        "On EC2/Ubuntu the default user is ubuntu. Use sudo to run commands as root.",
      ],
      notes: [
        "whoami — who am I logged in as",
        "id — full user and group info",
        "sudo su - — switch to root shell",
        "passwd username — change password",
        "chmod +x script.sh — make script executable",
        "chown ubuntu:ubuntu file — change file owner",
      ],
      commands: [
        {
          label: "User Management", tag: "users",
          code: `sudo adduser devuser
sudo usermod -aG sudo devuser   # add to sudo group
sudo userdel -r olduser          # delete user + home
cat /etc/passwd                  # list all users
groups username                  # show user groups`,
        },
        {
          label: "Permissions (chmod/chown)", tag: "perms",
          code: `chmod 755 script.sh   # rwxr-xr-x
chmod 600 secret.key  # rw------- (private)
chmod -R 644 /var/www/html
chown ubuntu:ubuntu /opt/myapp -R
# 7=rwx  6=rw-  5=r-x  4=r--  0=---`,
        },
      ],
      scenarios: [
        {
          title: "🔑 Deploy app as non-root user on EC2",
          when: "Best practice — never run apps as root",
          steps: ["Create a system user: sudo adduser --system --no-create-home appuser", "Own the app dir: sudo chown -R appuser:appuser /opt/myapp", "Set User=appuser in systemd service file"],
          code: `sudo adduser --system --no-create-home appuser
sudo chown -R appuser:appuser /opt/myapp
# /etc/systemd/system/myapp.service
[Service]
User=appuser
WorkingDirectory=/opt/myapp
ExecStart=/usr/bin/python3 app.py`,
        },
      ],
    },
    {
      icon: "⚙️",
      title: "Processes & Systemd",
      theory: [
        "A process is a running program. Linux assigns each a PID. systemd is the modern init system managing services on Ubuntu.",
        "Background jobs: & runs in background, nohup keeps running after logout, tmux/screen for persistent sessions.",
      ],
      notes: [
        "ps aux — list all running processes",
        "top / htop — live process monitor",
        "kill -9 PID — force kill a process",
        "pgrep nginx — find PID by name",
        "nohup python3 app.py & — run in background",
        "jobs — list background jobs in shell",
      ],
      commands: [
        {
          label: "Process Management", tag: "proc",
          code: `ps aux | grep python   # find python processes
kill -15 1234          # graceful stop
kill -9 1234           # force kill
pkill -f "gunicorn"    # kill by name pattern
pgrep -f "app.py"      # find PID
nohup ./script.sh > /tmp/out.log 2>&1 &`,
        },
        {
          label: "Systemd Services", tag: "systemd",
          code: `sudo systemctl start nginx
sudo systemctl stop nginx
sudo systemctl restart nginx
sudo systemctl status nginx
sudo systemctl enable nginx    # start on boot
sudo journalctl -u nginx -f    # live logs
sudo journalctl -u myapp --since "1 hour ago"`,
        },
      ],
      scenarios: [
        {
          title: "🚀 Run Python app as a persistent service",
          when: "Deploying Flask/FastAPI on Ubuntu EC2",
          steps: ["Create /etc/systemd/system/myapp.service", "Set User, WorkingDirectory, ExecStart", "Run: systemctl daemon-reload && systemctl enable myapp && systemctl start myapp"],
          code: `# /etc/systemd/system/myapp.service
[Unit]
Description=My Python App
After=network.target
[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu/myapp
ExecStart=/home/ubuntu/myapp/venv/bin/python app.py
Restart=always
RestartSec=3
[Install]
WantedBy=multi-user.target`,
        },
      ],
    },
    {
      icon: "🔌",
      title: "SSH & Remote Access",
      theory: [
        "SSH (Secure Shell) lets you securely connect to remote servers. On AWS EC2 you connect using a .pem key file. Key-based auth is much safer than passwords.",
        "SSH tunneling lets you forward ports from remote to local — useful for accessing databases or UIs behind firewalls.",
      ],
      notes: [
        "ssh -i key.pem ubuntu@1.2.3.4 — connect to EC2",
        "ssh-keygen -t ed25519 — generate new key pair",
        "scp file.txt ubuntu@server:/path/ — secure copy",
        "rsync -avz ./local/ ubuntu@server:/remote/ — sync",
        "ssh -L 8080:localhost:80 ubuntu@server — port forward",
      ],
      commands: [
        {
          label: "SSH Basics", tag: "ssh",
          code: `ssh -i ~/.ssh/mykey.pem ubuntu@ec2-1-2-3-4.compute.amazonaws.com
ssh-keygen -t ed25519 -C "my-ec2-key"
ssh-copy-id -i ~/.ssh/id_ed25519.pub ubuntu@server
# ~/.ssh/config:
Host myserver
  HostName 1.2.3.4
  User ubuntu
  IdentityFile ~/.ssh/mykey.pem`,
        },
        {
          label: "SCP & Rsync", tag: "scp",
          code: `scp -i key.pem app.tar.gz ubuntu@server:/opt/
scp -i key.pem ubuntu@server:/var/log/app.log ./
rsync -avz --progress ./dist/ ubuntu@server:/var/www/html/
# SSH port forwarding (access remote DB locally):
ssh -L 5432:localhost:5432 ubuntu@server -N &`,
        },
      ],
      scenarios: [
        {
          title: "🔐 Fix Permission denied (publickey) on EC2",
          when: "Cannot SSH into EC2 instance",
          steps: ["Fix pem permissions: chmod 400 key.pem", "Verify username (ubuntu for Ubuntu, ec2-user for Amazon Linux)", "Check security group allows port 22 from your IP"],
          code: `chmod 400 ~/.ssh/mykey.pem
ssh -vvv -i ~/.ssh/mykey.pem ubuntu@1.2.3.4
# If locked out: use EC2 Instance Connect in AWS Console`,
        },
      ],
    },
    {
      icon: "📝",
      title: "Cron Jobs & APT",
      theory: [
        "Cron is the built-in Linux task scheduler. A crontab entry has 5 time fields followed by the command: minute hour day month weekday command.",
        "Ubuntu uses apt to manage software packages. Always run apt update before installing.",
      ],
      notes: [
        "* * * * * — every minute",
        "0 * * * * — every hour at :00",
        "0 2 * * * — every day at 2 AM",
        "apt update — refresh package list",
        "apt install curl — install package",
      ],
      commands: [
        {
          label: "APT Package Manager", tag: "apt",
          code: `sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git vim htop unzip
apt show nginx              # package details
dpkg -l | grep -i python    # find installed packages
sudo apt remove nginx       # uninstall
sudo apt autoremove         # clean unused deps`,
        },
        {
          label: "Crontab", tag: "cron",
          code: `crontab -e         # edit your cron jobs
crontab -l         # list current cron jobs
# min  hour  day  month  weekday  command
  0    2     *    *      *   /home/ubuntu/backup.sh >> /var/log/backup.log 2>&1
  */5  *     *    *      *   /usr/bin/python3 /opt/monitor.py`,
        },
      ],
      scenarios: [
        {
          title: "⏰ Auto-backup to S3 every night at 2 AM",
          when: "Automated nightly S3 sync from EC2",
          steps: ["Edit crontab: crontab -e", "Add the line below", "Verify with: crontab -l"],
          code: `# Add to crontab (runs at 2 AM daily):
0 2 * * * aws s3 sync /var/data s3://my-bucket/backups/$(date +%Y-%m-%d) >> /var/log/s3backup.log 2>&1`,
        },
      ],
    },
    {
      icon: "🐳",
      title: "Docker Basics",
      theory: [
        "Docker packages applications into containers that include everything needed to run: code, runtime, system tools, and libraries — guaranteeing software runs the same everywhere.",
      ],
      notes: [
        "docker ps — list running containers",
        "docker images — list downloaded images",
        "docker stop id — graceful shutdown",
        "docker-compose up -d — run multi-container setups",
        "docker system prune -a — free up disk space",
      ],
      commands: [
        {
          label: "Container Management", tag: "docker",
          code: `docker run -d -p 8080:80 nginx
docker ps -a                     # all containers
docker stop my_container
docker rm -f my_container
docker logs -f my_container      # follow logs
docker exec -it my_container bash`,
        },
        {
          label: "Docker Compose", tag: "compose",
          code: `docker-compose up -d     # start all services
docker-compose down      # stop and remove
docker-compose logs -f   # logs of all services
docker-compose build     # rebuild images
docker system df         # disk usage
docker system prune -a --volumes -f   # clean all`,
        },
      ],
      scenarios: [
        {
          title: "🧹 Clean up Docker disk space",
          when: "Disk is full of old images and stopped containers",
          steps: ["Check usage: docker system df", "Prune everything unused"],
          code: `docker system df
docker system prune -a --volumes -f`,
        },
      ],
    },
  ],

  terraform: [
    {
      icon: "🏗️",
      title: "Terraform Basics",
      theory: [
        "Terraform is an Infrastructure-as-Code (IaC) tool. You write declarative HCL files describing what you want (EC2, S3, etc.) and Terraform figures out how to create/update/destroy it.",
        "The core workflow: init → plan → apply.",
      ],
      notes: [
        "terraform init — download providers, set up backend",
        "terraform plan — preview changes (dry run)",
        "terraform apply — create/update infrastructure",
        "terraform destroy — delete everything",
        "terraform fmt — auto-format HCL files",
        "terraform validate — check syntax errors",
        "terraform state list — list managed resources",
      ],
      commands: [
        {
          label: "Core Workflow", tag: "tf",
          code: `terraform init           # always first
terraform init -upgrade  # upgrade providers
terraform plan
terraform plan -out=tf.plan
terraform apply
terraform apply tf.plan
terraform apply -auto-approve
terraform destroy
terraform destroy -target aws_instance.web
terraform fmt -recursive
terraform validate`,
        },
        {
          label: "State Management", tag: "state",
          code: `terraform state list
terraform state show aws_s3_bucket.main
terraform state rm aws_instance.old
terraform state mv aws_instance.old aws_instance.new
terraform import aws_s3_bucket.main my-bucket-name`,
        },
      ],
      scenarios: [
        {
          title: "☁️ Create EC2 + S3 from scratch",
          when: "Setting up a new AWS environment with Terraform",
          steps: ["Create main.tf with provider + resources", "Run terraform init", "Run terraform plan to review", "Run terraform apply"],
          code: `# main.tf
terraform {
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.0" }
  }
}
provider "aws" { region = "us-east-1" }
resource "aws_instance" "web" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t3.micro"
  tags = { Name = "my-web-server" }
}
resource "aws_s3_bucket" "data" {
  bucket = "my-unique-bucket-12345"
}`,
        },
      ],
    },
    {
      icon: "🗄️",
      title: "Remote State & Backend",
      theory: [
        "By default Terraform saves state in a local terraform.tfstate file — dangerous for teams. Remote backends (S3 + DynamoDB) store state remotely and support locking to prevent concurrent changes.",
        "State contains sensitive info — treat it like a secret. Never commit it to git.",
      ],
      notes: [
        "Never commit terraform.tfstate to git",
        "Add *.tfstate and .terraform/ to .gitignore",
        "S3 backend + DynamoDB locking = team-safe setup",
        "terraform state pull — download remote state",
        "terraform state push — upload state (dangerous!)",
      ],
      commands: [
        {
          label: "S3 Backend Config", tag: "backend",
          code: `# backend.tf
terraform {
  backend "s3" {
    bucket         = "my-tf-state-bucket"
    key            = "prod/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-locks"
    encrypt        = true
  }
}
aws s3 mb s3://my-tf-state-bucket
aws dynamodb create-table \\
  --table-name terraform-locks \\
  --attribute-definitions AttributeName=LockID,AttributeType=S \\
  --key-schema AttributeName=LockID,KeyType=HASH \\
  --billing-mode PAY_PER_REQUEST`,
        },
      ],
      scenarios: [
        {
          title: "🔒 Set up team-safe Terraform state",
          when: "Multiple devs working on same infrastructure",
          steps: ["Create S3 bucket with versioning enabled", "Create DynamoDB table for locking", "Add backend block to terraform config", "Run terraform init to migrate state"],
          code: `aws s3 mb s3://company-tf-state-prod
aws s3api put-bucket-versioning \\
  --bucket company-tf-state-prod \\
  --versioning-configuration Status=Enabled
aws dynamodb create-table \\
  --table-name tf-locks \\
  --attribute-definitions AttributeName=LockID,AttributeType=S \\
  --key-schema AttributeName=LockID,KeyType=HASH \\
  --billing-mode PAY_PER_REQUEST`,
        },
      ],
    },
    {
      icon: "📦",
      title: "Modules & Variables",
      theory: [
        "Modules are reusable packages of Terraform configuration. Variables make configs flexible. Outputs expose values to other modules or for display.",
      ],
      notes: [
        "variables.tf — declare input variables",
        "outputs.tf — declare output values",
        "terraform.tfvars — set variable values",
        "terraform output — show output values",
        "module source can be local path or registry",
      ],
      commands: [
        {
          label: "Variables & Outputs", tag: "vars",
          code: `# variables.tf
variable "region" {
  type    = string
  default = "us-east-1"
}
variable "instance_type" {
  type    = string
}
# outputs.tf
output "instance_ip" {
  value = aws_instance.web.public_ip
}`,
        },
        {
          label: "Using a Module", tag: "module",
          code: `# main.tf
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "5.0.0"
  name = "my-vpc"
  cidr = "10.0.0.0/16"
  azs             = ["us-east-1a", "us-east-1b"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24"]
}`,
        },
      ],
      scenarios: [
        {
          title: "🧱 Structure a production Terraform project",
          when: "Building a real multi-env infrastructure repo",
          steps: ["Separate envs: environments/prod/, environments/dev/", "Shared modules in modules/", "Each env has main.tf, variables.tf, outputs.tf, backend.tf"],
          code: `# Directory structure:
# infra/
#   modules/
#     ec2/  vpc/  rds/
#   environments/
#     dev/
#       main.tf  variables.tf  backend.tf
#     prod/
#       main.tf  variables.tf  backend.tf`,
        },
      ],
    },
    {
      icon: "🔧",
      title: "Debugging & Import",
      theory: [
        "terraform import brings existing infrastructure under Terraform management. Use TF_LOG=DEBUG for verbose output when things go wrong.",
      ],
      notes: [
        "TF_LOG=DEBUG terraform plan — verbose output",
        "terraform refresh — sync state with real infra",
        "terraform taint — mark resource for recreation",
        "terraform graph — output dependency graph",
        "terraform console — interactive expression eval",
      ],
      commands: [
        {
          label: "Debug & Inspect", tag: "debug",
          code: `TF_LOG=DEBUG terraform plan 2> debug.log
terraform console
  > aws_instance.web.id
  > var.region
terraform graph | dot -Tpng > graph.png
terraform output -json
terraform show terraform.tfstate`,
        },
        {
          label: "Import & Taint", tag: "import",
          code: `# Import existing resource into state
terraform import aws_s3_bucket.b my-existing-bucket
terraform import aws_instance.web i-1234567890abcdef0
# Force recreation on next apply
terraform taint aws_instance.web
# Remove from state without deleting
terraform state rm aws_instance.web`,
        },
      ],
      scenarios: [
        {
          title: "🔄 Import existing AWS resources into Terraform",
          when: "You have manually-created AWS resources to manage with TF",
          steps: ["Write the resource block in your .tf file", "Run terraform import with the AWS resource ID", "Run terraform plan — should show no changes if config matches"],
          code: `# 1. Write resource block in main.tf:
resource "aws_s3_bucket" "assets" {
  bucket = "my-existing-assets-bucket"
}
# 2. Import it:
terraform import aws_s3_bucket.assets my-existing-assets-bucket
# 3. Verify:
terraform plan   # should show: No changes`,
        },
      ],
    },
    {
      icon: "🌍",
      title: "Workspaces",
      theory: [
        "Workspaces let you manage multiple state files with the same configuration — useful for dev/staging/prod environments without duplicating code.",
      ],
      notes: [
        "terraform workspace list — show all workspaces",
        "terraform workspace new prod — create workspace",
        "terraform workspace select prod — switch to it",
        "default workspace is always available",
        "state is isolated per workspace",
      ],
      commands: [
        {
          label: "Workspace Commands", tag: "workspace",
          code: `terraform workspace list
terraform workspace new dev
terraform workspace new prod
terraform workspace select prod
terraform workspace show    # current workspace
# Use in config:
# resource "aws_instance" "web" {
#   instance_type = terraform.workspace == "prod" ? "t3.large" : "t3.micro"
# }`,
        },
      ],
      scenarios: [
        {
          title: "🌍 Manage dev/prod with workspaces",
          when: "Same TF code, different environments",
          steps: ["Create workspaces for each env", "Use terraform.workspace in resource configs", "Apply per workspace"],
          code: `terraform workspace new dev
terraform workspace select dev
terraform apply -var-file=dev.tfvars

terraform workspace select prod
terraform apply -var-file=prod.tfvars`,
        },
      ],
    },
  ],

  kafka: [
    {
      icon: "📨",
      title: "Topics & Partitions",
      theory: [
        "Kafka organizes data into topics. Each topic is split into partitions for parallelism. Messages within a partition are strictly ordered. More partitions = more parallelism but more overhead.",
        "Replication factor determines how many copies exist across brokers. For production, use replication-factor=3.",
      ],
      notes: [
        "Topic = named stream of records",
        "Partition = ordered, immutable sequence",
        "Offset = position of a message in a partition",
        "Replication factor = number of copies",
        "Leader partition handles all reads/writes",
        "ISR = In-Sync Replicas",
      ],
      commands: [
        {
          label: "Topic Management", tag: "topics",
          code: `# Create topic
kafka-topics.sh --create --bootstrap-server localhost:9092 \\
  --topic events --partitions 3 --replication-factor 1

# List topics
kafka-topics.sh --list --bootstrap-server localhost:9092

# Describe topic
kafka-topics.sh --describe --topic events \\
  --bootstrap-server localhost:9092

# Delete topic
kafka-topics.sh --delete --topic events \\
  --bootstrap-server localhost:9092`,
        },
        {
          label: "Topic Config", tag: "config",
          code: `# Set retention to 7 days
kafka-configs.sh --bootstrap-server localhost:9092 \\
  --entity-type topics --entity-name events \\
  --alter --add-config retention.ms=604800000

# Set max message size to 10MB
kafka-configs.sh --bootstrap-server localhost:9092 \\
  --entity-type topics --entity-name events \\
  --alter --add-config max.message.bytes=10485760`,
        },
      ],
      scenarios: [
        {
          title: "📊 Scale a topic by adding partitions",
          when: "Consumer lag is growing — need more parallelism",
          steps: ["Check current partition count", "Increase partitions (can only increase, never decrease)", "Rebalance consumer group"],
          code: `kafka-topics.sh --describe --topic orders \\
  --bootstrap-server localhost:9092
kafka-topics.sh --alter --topic orders \\
  --partitions 6 --bootstrap-server localhost:9092`,
        },
      ],
    },
    {
      icon: "📤",
      title: "Producers & Consumers",
      theory: [
        "Producers publish messages to topics. Consumers read messages and track their position (offset) per partition. Consumer groups allow parallel processing — each partition is consumed by exactly one member.",
      ],
      notes: [
        "acks=all — wait for all replicas to acknowledge",
        "enable.idempotence=true — exactly-once delivery",
        "auto.offset.reset=earliest — read from beginning",
        "group.id — consumer group identifier",
        "commit offset after processing, not before",
      ],
      commands: [
        {
          label: "Console Producer/Consumer", tag: "console",
          code: `# Produce messages interactively
kafka-console-producer.sh \\
  --bootstrap-server localhost:9092 --topic events

# Consume from beginning
kafka-console-consumer.sh \\
  --bootstrap-server localhost:9092 \\
  --topic events --from-beginning

# Consume with key display
kafka-console-consumer.sh \\
  --bootstrap-server localhost:9092 --topic events \\
  --property print.key=true --property key.separator=:`,
        },
        {
          label: "Consumer Groups", tag: "groups",
          code: `# List consumer groups
kafka-consumer-groups.sh \\
  --bootstrap-server localhost:9092 --list

# Check lag
kafka-consumer-groups.sh \\
  --bootstrap-server localhost:9092 \\
  --describe --group my-group

# Reset offsets to beginning
kafka-consumer-groups.sh \\
  --bootstrap-server localhost:9092 \\
  --group my-group --topic events \\
  --reset-offsets --to-earliest --execute`,
        },
      ],
      scenarios: [
        {
          title: "🔴 Fix high consumer lag",
          when: "Messages are piling up faster than they are consumed",
          steps: ["Check lag per partition: kafka-consumer-groups --describe", "Scale up consumer instances (up to partition count)", "Check for slow processing in consumer code"],
          code: `kafka-consumer-groups.sh --bootstrap-server localhost:9092 \\
  --describe --group my-group
# Look for LAG column — high numbers mean slow consumers
# Add more consumers (up to number of partitions)
# Or increase partitions if already at max consumers`,
        },
      ],
    },
    {
      icon: "🔧",
      title: "Kafka Configuration",
      theory: [
        "Key broker settings affect durability, throughput, and retention. Producer settings control delivery guarantees. Consumer settings control how offsets are managed.",
      ],
      notes: [
        "log.retention.hours=168 — 7 day retention default",
        "log.segment.bytes — size before new segment",
        "min.insync.replicas — minimum replicas for writes",
        "compression.type — lz4 is best for throughput",
        "batch.size + linger.ms control producer batching",
      ],
      commands: [
        {
          label: "Broker Config Checks", tag: "broker",
          code: `# List all broker configs
kafka-configs.sh --bootstrap-server localhost:9092 \\
  --entity-type brokers --entity-name 0 --describe

# Check topic-level configs
kafka-configs.sh --bootstrap-server localhost:9092 \\
  --entity-type topics --entity-name events --describe

# View log dirs and sizes
kafka-log-dirs.sh --bootstrap-server localhost:9092 \\
  --topic-list events --describe`,
        },
      ],
      scenarios: [
        {
          title: "⚡ Tune for high throughput",
          when: "Need to push millions of messages per second",
          steps: ["Increase batch.size to 1MB", "Set linger.ms=5 to allow batching", "Use lz4 compression", "Increase buffer.memory"],
          code: `# Producer config for high throughput:
batch.size=1048576       # 1MB batches
linger.ms=5              # wait 5ms to batch
compression.type=lz4
buffer.memory=67108864   # 64MB buffer
acks=1                   # speed over durability`,
        },
      ],
    },
    {
      icon: "🩺",
      title: "Monitoring & Troubleshooting",
      theory: [
        "Monitor consumer lag, under-replicated partitions, and broker disk usage. High lag means consumers can't keep up. Under-replicated partitions mean a broker is likely down or slow.",
      ],
      notes: [
        "Under-replicated partitions = broker health issue",
        "Consumer lag > 0 growing = slow consumers",
        "Check broker logs: /var/log/kafka/server.log",
        "Use kafka-consumer-groups --describe regularly",
        "JMX metrics expose detailed broker internals",
      ],
      commands: [
        {
          label: "Health Checks", tag: "health",
          code: `# Check under-replicated partitions (should be 0)
kafka-topics.sh --bootstrap-server localhost:9092 \\
  --describe --under-replicated-partitions

# Check offline partitions
kafka-topics.sh --bootstrap-server localhost:9092 \\
  --describe --unavailable-partitions

# List all consumer groups and their lag
kafka-consumer-groups.sh \\
  --bootstrap-server localhost:9092 \\
  --list | xargs -I{} kafka-consumer-groups.sh \\
  --bootstrap-server localhost:9092 --describe --group {}`,
        },
      ],
      scenarios: [
        {
          title: "🚨 Broker is down — what to do",
          when: "One Kafka broker becomes unavailable",
          steps: ["Check under-replicated partitions immediately", "Restart the broker service", "Wait for partition reassignment to complete", "Verify ISR count returns to replication factor"],
          code: `# Check impact
kafka-topics.sh --bootstrap-server localhost:9092 \\
  --describe --under-replicated-partitions

# Restart broker (systemd)
sudo systemctl restart kafka

# Monitor recovery
watch -n 5 kafka-topics.sh --bootstrap-server localhost:9092 \\
  --describe --under-replicated-partitions`,
        },
      ],
    },
  ],

  boto3: [
    {
      icon: "☁️",
      title: "S3 Operations",
      theory: [
        "Boto3 is the AWS SDK for Python. boto3.client gives low-level API access. boto3.resource gives higher-level object-oriented access. Always handle ClientError for robust code.",
      ],
      notes: [
        "boto3.client('s3') — low-level S3 client",
        "boto3.resource('s3') — high-level S3 resource",
        "Paginator handles >1000 objects automatically",
        "Presigned URLs expire after ExpiresIn seconds",
        "Never hardcode credentials — use IAM roles or env vars",
      ],
      commands: [
        {
          label: "S3 Essentials", tag: "s3",
          code: `import boto3
s3 = boto3.client('s3')
s3.upload_file('file.txt', 'bucket', 'key/file.txt')
s3.download_file('bucket', 'key/file.txt', '/tmp/file.txt')
s3.put_object(Bucket='b', Key='k', Body=b'data')
r = s3.get_object(Bucket='b', Key='k')
data = r['Body'].read()
url = s3.generate_presigned_url('get_object',
      Params={'Bucket':'b','Key':'k'}, ExpiresIn=3600)`,
        },
        {
          label: "List & Delete Objects", tag: "s3",
          code: `# Paginated list (handles >1000 objects)
paginator = s3.get_paginator('list_objects_v2')
for page in paginator.paginate(Bucket='my-bucket', Prefix='logs/'):
    for obj in page.get('Contents', []):
        print(obj['Key'], obj['Size'])

# Delete objects
s3.delete_object(Bucket='b', Key='k')
# Bulk delete
s3.delete_objects(Bucket='b',
    Delete={'Objects': [{'Key':'k1'},{'Key':'k2'}]})`,
        },
      ],
      scenarios: [
        {
          title: "📂 Sync a local folder to S3",
          when: "Uploading build artifacts or backups to S3",
          steps: ["Walk local directory", "Upload each file preserving folder structure"],
          code: `import boto3, os
s3 = boto3.client('s3')
local_dir = './dist'
bucket = 'my-deploy-bucket'
for root, dirs, files in os.walk(local_dir):
    for file in files:
        local_path = os.path.join(root, file)
        s3_key = os.path.relpath(local_path, local_dir)
        s3.upload_file(local_path, bucket, s3_key)
        print(f"Uploaded: {s3_key}")`,
        },
      ],
    },
    {
      icon: "🖥️",
      title: "EC2 Operations",
      theory: [
        "Boto3 EC2 client lets you describe, start, stop, and manage instances programmatically. Use Filters to find specific instances. Always use InstanceIds lists for start/stop.",
      ],
      notes: [
        "ec2.describe_instances returns nested structure",
        "Reservations contain Instances lists",
        "Use Filters for targeted queries",
        "Waiter blocks until instance reaches desired state",
        "Tags help identify instances programmatically",
      ],
      commands: [
        {
          label: "EC2 Instances", tag: "ec2",
          code: `import boto3
ec2 = boto3.client('ec2')
# List running instances
r = ec2.describe_instances(Filters=[
    {'Name': 'instance-state-name', 'Values': ['running']}])
for res in r['Reservations']:
    for inst in res['Instances']:
        print(inst['InstanceId'], inst['InstanceType'])

ec2.stop_instances(InstanceIds=['i-123456'])
ec2.start_instances(InstanceIds=['i-123456'])
# Wait until running
waiter = ec2.get_waiter('instance_running')
waiter.wait(InstanceIds=['i-123456'])`,
        },
      ],
      scenarios: [
        {
          title: "🔄 Auto-stop EC2 instances by tag",
          when: "Saving costs by stopping dev instances at night",
          steps: ["Query instances by tag Environment=dev", "Stop all running ones"],
          code: `import boto3
ec2 = boto3.client('ec2')
r = ec2.describe_instances(Filters=[
    {'Name': 'tag:Environment', 'Values': ['dev']},
    {'Name': 'instance-state-name', 'Values': ['running']}])
ids = [i['InstanceId']
       for res in r['Reservations']
       for i in res['Instances']]
if ids:
    ec2.stop_instances(InstanceIds=ids)
    print(f"Stopped: {ids}")`,
        },
      ],
    },
    {
      icon: "⚡",
      title: "Lambda & SQS",
      theory: [
        "Invoke Lambda functions synchronously (RequestResponse) or async (Event). SQS provides reliable message queuing — always delete messages after processing to prevent redelivery.",
      ],
      notes: [
        "InvocationType=RequestResponse — sync, waits for result",
        "InvocationType=Event — async, fire and forget",
        "SQS WaitTimeSeconds=20 — long polling (cheaper)",
        "MaxNumberOfMessages max is 10 per receive call",
        "Always delete SQS message after processing",
      ],
      commands: [
        {
          label: "Lambda Invoke", tag: "lambda",
          code: `import boto3, json
lmb = boto3.client('lambda')
res = lmb.invoke(
    FunctionName='my-func',
    InvocationType='RequestResponse',
    Payload=json.dumps({"key": "value"}).encode()
)
result = json.loads(res['Payload'].read())
print(result)`,
        },
        {
          label: "SQS Send & Receive", tag: "sqs",
          code: `sqs = boto3.client('sqs')
URL = 'https://sqs.us-east-1.amazonaws.com/123456789/my-queue'
# Send
sqs.send_message(QueueUrl=URL, MessageBody='hello world')
# Receive and delete
msgs = sqs.receive_message(QueueUrl=URL,
    MaxNumberOfMessages=10, WaitTimeSeconds=20)
for m in msgs.get('Messages', []):
    print(m['Body'])
    sqs.delete_message(QueueUrl=URL,
        ReceiptHandle=m['ReceiptHandle'])`,
        },
      ],
      scenarios: [
        {
          title: "🔁 Build a simple SQS worker loop",
          when: "Processing background jobs from a queue",
          steps: ["Poll queue in a loop", "Process each message", "Delete on success, leave on failure for retry"],
          code: `import boto3, time
sqs = boto3.client('sqs')
URL = 'YOUR_QUEUE_URL'
while True:
    resp = sqs.receive_message(QueueUrl=URL,
        MaxNumberOfMessages=5, WaitTimeSeconds=20)
    for msg in resp.get('Messages', []):
        try:
            process(msg['Body'])  # your logic here
            sqs.delete_message(QueueUrl=URL,
                ReceiptHandle=msg['ReceiptHandle'])
        except Exception as e:
            print(f"Failed: {e}")  # will retry
    time.sleep(1)`,
        },
      ],
    },
    {
      icon: "🗃️",
      title: "DynamoDB",
      theory: [
        "DynamoDB is AWS's managed NoSQL database. Access via boto3.resource for cleaner syntax. Every item must have the primary key. Use Decimal not float for numbers.",
      ],
      notes: [
        "Table needs partition key (+ optional sort key)",
        "put_item overwrites entire item",
        "update_item patches specific attributes",
        "Use Decimal for numeric values, not float",
        "query uses key conditions, scan reads all (expensive)",
      ],
      commands: [
        {
          label: "DynamoDB CRUD", tag: "dynamo",
          code: `import boto3
from decimal import Decimal
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('Users')
# Create/Update
table.put_item(Item={'id':'123','name':'Alice','age':Decimal(30)})
# Read
item = table.get_item(Key={'id':'123'})['Item']
# Update
table.update_item(
    Key={'id':'123'},
    UpdateExpression='SET age = :a',
    ExpressionAttributeValues={':a': Decimal(31)})
# Delete
table.delete_item(Key={'id':'123'})`,
        },
        {
          label: "Query & Scan", tag: "dynamo",
          code: `from boto3.dynamodb.conditions import Key, Attr
# Query by partition key (efficient)
res = table.query(
    KeyConditionExpression=Key('userId').eq('user123'))
items = res['Items']
# Scan with filter (scans ALL items - use sparingly)
res = table.scan(
    FilterExpression=Attr('age').gt(25))
items = res['Items']`,
        },
      ],
      scenarios: [
        {
          title: "📊 Batch write items to DynamoDB",
          when: "Importing large datasets into DynamoDB",
          steps: ["Use batch_writer context manager", "It handles batching + retries automatically"],
          code: `import boto3
from decimal import Decimal
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('Products')
items = [{'id': str(i), 'price': Decimal(str(i*1.5))}
         for i in range(1000)]
with table.batch_writer() as batch:
    for item in items:
        batch.put_item(Item=item)
print("Done — 1000 items written")`,
        },
      ],
    },
    {
      icon: "🔐",
      title: "IAM & Sessions",
      theory: [
        "Use IAM roles instead of hardcoded credentials. boto3 automatically uses EC2 instance roles, ECS task roles, or environment variables. For cross-account access, assume a role.",
      ],
      notes: [
        "Never hardcode AWS keys in code",
        "Use IAM roles on EC2, Lambda, ECS",
        "AWS_PROFILE env var selects named profile",
        "boto3.Session() creates isolated credential context",
        "STS AssumeRole for cross-account access",
      ],
      commands: [
        {
          label: "Sessions & Assume Role", tag: "iam",
          code: `import boto3
# Use a named profile
session = boto3.Session(profile_name='prod')
s3 = session.client('s3')

# Assume a cross-account role
sts = boto3.client('sts')
creds = sts.assume_role(
    RoleArn='arn:aws:iam::123456789:role/MyRole',
    RoleSessionName='my-session'
)['Credentials']
s3 = boto3.client('s3',
    aws_access_key_id=creds['AccessKeyId'],
    aws_secret_access_key=creds['SecretAccessKey'],
    aws_session_token=creds['SessionToken'])`,
        },
      ],
      scenarios: [
        {
          title: "🛡️ Error handling best practices",
          when: "Writing production-grade boto3 code",
          steps: ["Wrap in try/except for ClientError", "Check error code to handle specifically", "Use NoCredentialsError for auth failures"],
          code: `import boto3
from botocore.exceptions import ClientError, NoCredentialsError
try:
    s3 = boto3.client('s3')
    s3.download_file('bucket', 'key', '/tmp/f')
except ClientError as e:
    code = e.response['Error']['Code']
    if code == '404':
        print("File not found")
    elif code == '403':
        print("Access denied")
    else:
        raise
except NoCredentialsError:
    print("No AWS credentials found")`,
        },
      ],
    },
  ],

  networking: [
    {
      icon: "🌐",
      title: "Linux Networking",
      theory: [
        "Linux networking tools let you inspect IPs, routes, open ports, and test connectivity. Modern systems use ip instead of ifconfig, and ss instead of netstat.",
      ],
      notes: [
        "ip a — show all network interfaces and IPs",
        "ip route show — display routing table",
        "ss -tlnp — TCP listening ports with process names",
        "dig / nslookup — DNS lookup tools",
        "traceroute — trace the network path",
        "nc -zv host port — test if a port is open",
      ],
      commands: [
        {
          label: "Network Inspection", tag: "net",
          code: `ip a                     # show all IPs
ip route show            # routing table
ss -tlnp                 # TCP listening ports
netstat -tlnp            # alternative (older)
curl -v https://api.example.com
dig google.com           # DNS lookup
nslookup google.com      # DNS alternative
traceroute 8.8.8.8       # trace path
ping -c 4 8.8.8.8        # test connectivity
nc -zv host 80           # test if port is open`,
        },
        {
          label: "Firewall (iptables/ufw)", tag: "firewall",
          code: `# UFW (easier on Ubuntu)
sudo ufw status
sudo ufw allow 22/tcp     # allow SSH
sudo ufw allow 80/tcp     # allow HTTP
sudo ufw deny 3306/tcp    # block MySQL from outside
sudo ufw enable

# iptables
iptables -L -n            # list rules
iptables -A INPUT -p tcp --dport 80 -j ACCEPT`,
        },
      ],
      scenarios: [
        {
          title: "🔍 Debug: app not reachable from internet",
          when: "EC2 app is running but not accessible from browser",
          steps: ["Check app is listening: ss -tlnp", "Check security group allows the port", "Check OS firewall (ufw status)", "Test from inside: curl localhost:3000"],
          code: `ss -tlnp | grep 3000    # is app listening?
curl localhost:3000     # works internally?
# In AWS Console: check Security Group inbound rules
# Allow TCP port 3000 from 0.0.0.0/0
sudo ufw allow 3000/tcp  # if ufw is active`,
        },
      ],
    },
    {
      icon: "🏛️",
      title: "AWS VPC",
      theory: [
        "A VPC (Virtual Private Cloud) is your isolated network in AWS. Subnets divide the VPC into public (internet-accessible) and private (internal-only) sections. An Internet Gateway provides internet access. NAT Gateway lets private subnets reach internet without being reachable from it.",
      ],
      notes: [
        "VPC CIDR: typically 10.0.0.0/16 (65,536 IPs)",
        "Public subnet: has route to Internet Gateway",
        "Private subnet: no direct internet route",
        "NAT Gateway: outbound internet for private subnets",
        "Security groups are stateful firewalls",
        "NACLs are stateless subnet-level firewalls",
      ],
      commands: [
        {
          label: "VPC Inspection (AWS CLI)", tag: "vpc",
          code: `aws ec2 describe-vpcs
aws ec2 describe-subnets
aws ec2 describe-security-groups
aws ec2 describe-route-tables
aws ec2 describe-internet-gateways
aws ec2 describe-nat-gateways`,
        },
        {
          label: "Security Group Rules", tag: "sg",
          code: `# Add inbound rule
aws ec2 authorize-security-group-ingress \\
  --group-id sg-12345 \\
  --protocol tcp --port 80 --cidr 0.0.0.0/0

# Add outbound rule
aws ec2 authorize-security-group-egress \\
  --group-id sg-12345 \\
  --protocol tcp --port 443 --cidr 0.0.0.0/0

# Describe rules
aws ec2 describe-security-group-rules \\
  --filters Name=group-id,Values=sg-12345`,
        },
      ],
      scenarios: [
        {
          title: "🔒 EC2 can't reach internet from private subnet",
          when: "Private subnet instance needs internet for package installs",
          steps: ["Verify NAT Gateway exists in public subnet", "Check route table has 0.0.0.0/0 → NAT Gateway", "Ensure security group allows outbound 443/80"],
          code: `# Check route table of private subnet
aws ec2 describe-route-tables \\
  --filters Name=association.subnet-id,Values=subnet-XXXXX
# Look for: 0.0.0.0/0 -> nat-XXXXXXX
# If missing, add the route:
aws ec2 create-route \\
  --route-table-id rtb-XXXXX \\
  --destination-cidr-block 0.0.0.0/0 \\
  --nat-gateway-id nat-XXXXX`,
        },
      ],
    },
    {
      icon: "🔗",
      title: "VPC Peering & Transit Gateway",
      theory: [
        "VPC Peering connects two VPCs so they can communicate privately. Transit Gateway acts as a hub connecting many VPCs and on-premises networks — much simpler than a mesh of peering connections.",
      ],
      notes: [
        "Peering: no transitive routing (A-B-C doesn't mean A-C)",
        "Transit Gateway: hub-and-spoke, supports transitive routing",
        "Both require route table updates after setup",
        "Cross-account peering requires acceptance from other side",
        "No overlapping CIDRs between peered VPCs",
      ],
      commands: [
        {
          label: "VPC Peering", tag: "peering",
          code: `# Create peering connection
aws ec2 create-vpc-peering-connection \\
  --vpc-id vpc-111 --peer-vpc-id vpc-222

# Accept peering (from peer account/region)
aws ec2 accept-vpc-peering-connection \\
  --vpc-peering-connection-id pcx-XXXXX

# Add routes (both sides need this!)
aws ec2 create-route \\
  --route-table-id rtb-AAA \\
  --destination-cidr-block 10.1.0.0/16 \\
  --vpc-peering-connection-id pcx-XXXXX`,
        },
      ],
      scenarios: [
        {
          title: "🔗 Connect two VPCs in different accounts",
          when: "Microservices in separate AWS accounts need to communicate",
          steps: ["Create peering from account A (requester)", "Accept in account B (accepter)", "Update route tables in both VPCs", "Update security groups to allow traffic from peer CIDR"],
          code: `# Account A: create request
aws ec2 create-vpc-peering-connection \\
  --vpc-id vpc-aaa --peer-vpc-id vpc-bbb \\
  --peer-owner-id 987654321098
# Account B: accept
aws ec2 accept-vpc-peering-connection \\
  --vpc-peering-connection-id pcx-XXXXX
# Both accounts: add routes and update SGs`,
        },
      ],
    },
    {
      icon: "🌍",
      title: "Route 53 & DNS",
      theory: [
        "Route 53 is AWS's managed DNS service. Hosted zones hold DNS records for your domain. Common record types: A (IPv4), CNAME (alias), ALIAS (AWS-specific, for root domains), MX (mail).",
      ],
      notes: [
        "A record: domain → IPv4 address",
        "CNAME: domain → another domain (not root)",
        "ALIAS: root domain → AWS resource (free queries)",
        "TTL: how long DNS resolvers cache the record",
        "Private hosted zones: DNS within VPC only",
      ],
      commands: [
        {
          label: "Route 53 CLI", tag: "r53",
          code: `aws route53 list-hosted-zones
aws route53 list-resource-record-sets \\
  --hosted-zone-id ZXXXXXXXXXX

# Create/update record (change batch)
aws route53 change-resource-record-sets \\
  --hosted-zone-id ZXXXXXXXXXX \\
  --change-batch file://record.json`,
        },
        {
          label: "DNS Debug", tag: "dns",
          code: `dig myapp.example.com          # full DNS lookup
dig myapp.example.com +short   # just the IP
dig myapp.example.com NS       # name servers
dig @8.8.8.8 myapp.example.com # use Google DNS
nslookup myapp.example.com
# Test propagation:
dig myapp.example.com +trace`,
        },
      ],
      scenarios: [
        {
          title: "🌐 Point domain to EC2 or ALB",
          when: "Launching a new app and connecting domain to AWS",
          steps: ["Get EC2 public IP or ALB DNS name", "Create A record (for IP) or CNAME/ALIAS record (for ALB)", "Set TTL to 300 for fast propagation initially"],
          code: `# record.json for ALB ALIAS record:
{
  "Changes": [{
    "Action": "UPSERT",
    "ResourceRecordSet": {
      "Name": "app.example.com",
      "Type": "A",
      "AliasTarget": {
        "HostedZoneId": "Z35SXDOTRQ7X7K",
        "DNSName": "my-alb-1234.us-east-1.elb.amazonaws.com",
        "EvaluateTargetHealth": true
      }
    }
  }]
}`,
        },
      ],
    },
    {
      icon: "🔵",
      title: "Azure Networking",
      theory: [
        "Azure uses Virtual Networks (VNet) instead of VPC. Network Security Groups (NSG) work like AWS Security Groups. Azure has no equivalent of Internet Gateway — VMs with public IPs are internet-accessible by default.",
      ],
      notes: [
        "VNet = AWS VPC",
        "NSG = AWS Security Group (but applied to NIC or subnet)",
        "Azure Bastion = managed SSH/RDP without public IP",
        "Azure Load Balancer = AWS NLB",
        "Application Gateway = AWS ALB",
        "ExpressRoute = AWS Direct Connect",
      ],
      commands: [
        {
          label: "Azure CLI Networking", tag: "azure",
          code: `az network vnet list
az network vnet show -g myRG -n myVNet
az network nsg list -g myRG
az network nsg rule list -g myRG --nsg-name myNSG

# Create NSG rule
az network nsg rule create \\
  -g myRG --nsg-name myNSG -n AllowHTTP \\
  --priority 100 --protocol Tcp \\
  --destination-port-range 80 443 --access Allow`,
        },
      ],
      scenarios: [
        {
          title: "🔵 AWS vs Azure — Quick mapping",
          when: "Moving from AWS to Azure or vice versa",
          steps: ["Use this reference for service equivalents"],
          code: `# AWS              -> Azure
# VPC              -> VNet
# Subnet           -> Subnet
# Security Group   -> NSG
# IGW              -> (automatic for public IPs)
# NAT Gateway      -> NAT Gateway
# ALB              -> Application Gateway
# NLB              -> Azure Load Balancer
# Route 53         -> Azure DNS
# Direct Connect   -> ExpressRoute
# VPC Peering      -> VNet Peering
# Transit Gateway  -> Azure Virtual WAN
# EC2              -> Azure VM
# S3               -> Azure Blob Storage
# Lambda           -> Azure Functions`,
        },
      ],
    },
  ],
};

const CHEAT = [
  { title: "🐧 Linux", color: "#00e5a0", items: [
    { label: "File System", code: `ls -lah\npwd\nfind . -name "*.py"\ndu -sh /*\ndf -h\ntail -f /var/log/syslog` },
    { label: "Processes", code: `ps aux | grep app\nsystemctl status nginx\nsystemctl restart app\njournalctl -u app -f\nkill -9 $(pgrep python)\nnohup ./app.sh &` },
    { label: "Docker", code: `docker run -d -p 80:80 nginx\ndocker ps -a\ndocker logs -f id\ndocker exec -it id bash\ndocker system prune -a\ndocker-compose up -d` },
    { label: "Networking", code: `ip a\nnetstat -tlnp\ncurl -I https://example.com\nss -s\niptables -L -n\nnmap -p 80,443 example.com` },
    { label: "Users & Perms", code: `whoami && id\nsudo adduser devops\nusermod -aG sudo devops\nchmod 755 script.sh\nchown ubuntu:ubuntu /app -R\nssh-keygen -t ed25519` },
  ]},
  { title: "🏗️ Terraform", color: "#7b68ee", items: [
    { label: "Core Commands", code: `terraform init\nterraform plan\nterraform apply -auto-approve\nterraform destroy\nterraform fmt -recursive\nterraform state list` },
    { label: "Import & Debug", code: `terraform import aws_s3_bucket.b my-bucket\nterraform state show aws_instance.web\nterraform output -json\nterraform validate\nTF_LOG=DEBUG terraform plan` },
  ]},
  { title: "📨 Kafka", color: "#ff6b35", items: [
    { label: "Topics", code: `kafka-topics.sh --create --bootstrap-server localhost:9092 \\\n  --topic events --partitions 3 --replication-factor 1\nkafka-topics.sh --list --bootstrap-server localhost:9092\nkafka-topics.sh --describe --topic events --bootstrap-server localhost:9092` },
    { label: "Produce & Consume", code: `kafka-console-producer.sh --bootstrap-server localhost:9092 --topic events\nkafka-console-consumer.sh --bootstrap-server localhost:9092 \\\n  --topic events --from-beginning\nkafka-consumer-groups.sh --bootstrap-server localhost:9092 \\\n  --describe --group my-group` },
  ]},
  { title: "☁️ Boto3", color: "#ffd700", items: [
    { label: "S3", code: `s3 = boto3.client('s3')\ns3.upload_file('f.txt', 'bucket', 'key')\ns3.download_file('bucket', 'key', '/tmp/f')\ns3.put_object(Bucket='b', Key='k', Body=b'data')\nurl = s3.generate_presigned_url('get_object',\n      Params={'Bucket':'b','Key':'k'}, ExpiresIn=3600)` },
    { label: "EC2 & DynamoDB", code: `ec2 = boto3.client('ec2')\nec2.describe_instances(Filters=[...])\nec2.stop_instances(InstanceIds=['i-123'])\ndynamodb = boto3.resource('dynamodb')\ntable = dynamodb.Table('Users')\ntable.put_item(Item={'id':'1','name':'Alice'})` },
    { label: "Error Handling", code: `from botocore.exceptions import ClientError\ntry:\n    s3.download_file('bucket','key','/tmp/f')\nexcept ClientError as e:\n    code = e.response['Error']['Code']\n    if code == '404': print("Not found")\n    elif code == '403': print("Access denied")\n    else: raise` },
  ]},
  { title: "🌐 Networking", color: "#00bfff", items: [
    { label: "Linux Commands", code: `ip a\nip route show\nss -tlnp\ncurl -v https://api.example.com\ndig google.com\ntraceroute 8.8.8.8\nping -c 4 8.8.8.8\nnc -zv host 80` },
    { label: "AWS CLI", code: `aws ec2 describe-vpcs\naws ec2 describe-security-groups\naws ec2 describe-route-tables\naws route53 list-hosted-zones\naws ec2 describe-nat-gateways` },
  ]},
];

// ─── COMPONENTS ────────────────────────────────────────────────

function CodeBlock({ code }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <div style={{ position: "relative", borderRadius: 8, overflow: "hidden", background: "#0d1117" }}>
      <button onClick={copy} style={{
        position: "absolute", top: 8, right: 8, zIndex: 2,
        background: copied ? "#00e5a0" : "#1c2540",
        border: "1px solid " + (copied ? "#00e5a0" : "#2d3754"),
        color: copied ? "#000" : "#9aaed4",
        borderRadius: 6, padding: "3px 10px",
        fontSize: 11, fontFamily: "monospace", cursor: "pointer",
        transition: "all .15s",
      }}>
        {copied ? "✓ copied" : "copy"}
      </button>
      <pre style={{
        margin: 0, padding: "14px 16px",
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        fontSize: 12, lineHeight: 1.7,
        color: "#c9d1d9", overflowX: "auto",
        whiteSpace: "pre",
      }}>
        <code>{code}</code>
      </pre>
    </div>
  );
}

function TopicView({ section, color }) {
  const list = DATA[section];
  const [idx, setIdx] = useState(0);
  const t = list[idx];

  return (
    <div style={{ display: "flex", height: "calc(100vh - 54px)" }}>
      {/* Sidebar */}
      <div style={{
        width: 210, minWidth: 210, flexShrink: 0,
        background: "#090d1a", borderRight: "1px solid #1c2540",
        overflowY: "auto", padding: "10px 0",
      }}>
        <div style={{
          padding: "12px 14px 6px",
          fontFamily: "monospace", fontSize: 9,
          letterSpacing: "2.5px", textTransform: "uppercase",
          color: "#3a4870",
        }}>
          {section} topics
        </div>
        {list.map((item, i) => (
          <button key={i} onClick={() => setIdx(i)} style={{
            display: "block", width: "100%",
            padding: "9px 14px 9px 17px",
            border: "none",
            borderLeft: `3px solid ${i === idx ? color : "transparent"}`,
            background: i === idx ? "#0d1221" : "transparent",
            color: i === idx ? "#fff" : "#5a6ea0",
            fontFamily: "monospace", fontSize: 11,
            textAlign: "left", cursor: "pointer",
            transition: "all .15s", lineHeight: 1.5,
          }}>
            {item.icon} {item.title}
          </button>
        ))}
      </div>

      {/* Main content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "36px 40px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 32 }}>
          <span style={{ fontSize: 34 }}>{t.icon}</span>
          <div>
            <div style={{ fontFamily: "'Syne', 'Segoe UI', sans-serif", fontWeight: 800, fontSize: 24, color }}>
              {t.title}
            </div>
            <div style={{ fontFamily: "monospace", fontSize: 10, color: "#5a6ea0", marginTop: 3 }}>
              {section} · {idx + 1} of {list.length}
            </div>
          </div>
        </div>

        {/* Theory */}
        <SectionLabel label="📖 Theory" />
        <div style={{
          background: "#0d1221", border: "1px solid #1c2540",
          borderLeft: `3px solid ${color}`, borderRadius: 12,
          padding: "18px 20px", marginBottom: 20,
        }}>
          {t.theory.map((p, i) => (
            <p key={i} style={{ fontSize: 14, color: "#9aaed4", lineHeight: 1.8, marginTop: i > 0 ? 10 : 0 }}>
              {p}
            </p>
          ))}
        </div>

        {/* Notes */}
        <SectionLabel label="📌 Quick Notes" />
        <ul style={{
          background: "#0d1221", border: "1px solid #1c2540",
          borderRadius: 12, padding: "14px 18px",
          listStyle: "none", marginBottom: 20,
          display: "flex", flexDirection: "column", gap: 8,
        }}>
          {t.notes.map((n, i) => (
            <li key={i} style={{
              fontSize: 13.5, color: "#9aaed4", paddingLeft: 18,
              position: "relative", lineHeight: 1.7,
            }}>
              <span style={{
                position: "absolute", left: 0, top: 5,
                fontSize: 8, color,
              }}>▶</span>
              <code style={{
                fontFamily: "monospace", fontSize: 12,
                background: "#111729", color: "#c9d1d9",
                padding: "1px 6px", borderRadius: 4,
              }}>
                {n.split(" — ")[0]}
              </code>
              {n.includes(" — ") && <span style={{ color: "#5a6ea0" }}> — {n.split(" — ").slice(1).join(" — ")}</span>}
            </li>
          ))}
        </ul>

        {/* Commands */}
        <SectionLabel label="💻 Commands" />
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
          gap: 12, marginBottom: 20,
        }}>
          {(t.commands || []).map((cmd, i) => (
            <div key={i} style={{
              background: "#090d1a", border: "1px solid #1c2540",
              borderRadius: 10, overflow: "hidden",
            }}>
              <div style={{
                padding: "8px 14px", background: "#0d1221",
                borderBottom: "1px solid #1c2540",
                display: "flex", alignItems: "center", gap: 8,
              }}>
                <span style={{ fontFamily: "monospace", fontSize: 11, color }}>
                  {cmd.label}
                </span>
                <span style={{
                  padding: "2px 8px", borderRadius: 10,
                  fontSize: 9, fontFamily: "monospace",
                  background: color + "22", color,
                  border: `1px solid ${color}44`,
                }}>
                  {cmd.tag}
                </span>
              </div>
              <CodeBlock code={cmd.code} />
            </div>
          ))}
        </div>

        {/* Scenarios */}
        {t.scenarios && t.scenarios.length > 0 && (
          <>
            <SectionLabel label="🎬 Scenarios" />
            {t.scenarios.map((s, i) => (
              <div key={i} style={{
                background: "#090d1a", border: "1px solid #1c2540",
                borderLeft: `3px solid ${color}`, borderRadius: 14,
                padding: 22, marginBottom: 14,
              }}>
                <div style={{
                  fontFamily: "'Syne', sans-serif", fontWeight: 700,
                  fontSize: 15, color: "#fff", marginBottom: 4,
                }}>
                  {s.title}
                </div>
                <div style={{
                  fontFamily: "monospace", fontSize: 11,
                  color: "#5a6ea0", marginBottom: 12, fontStyle: "italic",
                }}>
                  📍 When: {s.when}
                </div>
                <ol style={{ paddingLeft: 20, marginBottom: 14 }}>
                  {s.steps.map((step, si) => (
                    <li key={si} style={{ fontSize: 13.5, color: "#9aaed4", lineHeight: 1.8 }}>
                      {step}
                    </li>
                  ))}
                </ol>
                <CodeBlock code={s.code} />
              </div>
            ))}
          </>
        )}

        {/* Prev / Next */}
        <div style={{
          display: "flex", alignItems: "center", gap: 14,
          marginTop: 36, paddingTop: 24,
          borderTop: "1px solid #1c2540",
        }}>
          <NavArrow label="← Prev" disabled={idx === 0} color={color} onClick={() => setIdx(i => i - 1)} />
          <div style={{ display: "flex", gap: 5, alignItems: "center", margin: "auto" }}>
            {list.map((_, i) => (
              <div key={i} onClick={() => setIdx(i)} style={{
                height: 6, width: i === idx ? 18 : 6,
                borderRadius: 3, cursor: "pointer",
                background: i === idx ? color : "#2d3754",
                transition: "all .2s",
              }} />
            ))}
          </div>
          <NavArrow label="Next →" disabled={idx === list.length - 1} color={color} onClick={() => setIdx(i => i + 1)} />
        </div>
      </div>
    </div>
  );
}

function NavArrow({ label, disabled, color, onClick }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: "8px 20px", borderRadius: 8,
      border: `1px solid ${disabled ? "#1c2540" : "#2d3754"}`,
      background: "#0d1221", color: disabled ? "#2d3754" : "#9aaed4",
      fontFamily: "monospace", fontSize: 12,
      cursor: disabled ? "not-allowed" : "pointer",
      transition: "all .15s", opacity: disabled ? 0.4 : 1,
    }}
      onMouseEnter={e => { if (!disabled) { e.target.style.borderColor = color; e.target.style.color = "#fff"; } }}
      onMouseLeave={e => { e.target.style.borderColor = disabled ? "#1c2540" : "#2d3754"; e.target.style.color = disabled ? "#2d3754" : "#9aaed4"; }}
    >
      {label}
    </button>
  );
}

function SectionLabel({ label }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      fontFamily: "monospace", fontSize: 9,
      letterSpacing: "2.5px", textTransform: "uppercase",
      color: "#3a4870", margin: "24px 0 10px",
    }}>
      {label}
      <div style={{ flex: 1, height: 1, background: "#1c2540" }} />
    </div>
  );
}

function CheatsheetView() {
  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 24px" }}>
      <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 28, color: "#fff", marginBottom: 4 }}>
        📋 Full Cheatsheet
      </div>
      <div style={{ fontFamily: "monospace", fontSize: 11, color: "#5a6ea0", marginBottom: 40 }}>
        All commands in one place — Linux · Terraform · Kafka · Boto3 · Networking
      </div>
      {CHEAT.map((sec, si) => (
        <div key={si} style={{ marginBottom: 44 }}>
          <div style={{
            fontFamily: "'Syne', sans-serif", fontWeight: 800,
            fontSize: 20, color: sec.color, marginBottom: 18,
          }}>
            {sec.title}
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(310px, 1fr))",
            gap: 12,
          }}>
            {sec.items.map((item, ii) => (
              <div key={ii} style={{
                background: "#090d1a", border: "1px solid #1c2540",
                borderRadius: 12, overflow: "hidden",
              }}>
                <div style={{
                  padding: "8px 14px", background: "#0d1221",
                  borderBottom: "1px solid #1c2540",
                  fontFamily: "monospace", fontSize: 11, color: sec.color,
                }}>
                  {item.label}
                </div>
                <CodeBlock code={item.code} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function HomePage({ onNavigate }) {
  const cards = [
    { id: "linux",     icon: "🐧", title: "Linux Mastery",     desc: "File system, users, processes, SSH, cron, systemd, and Docker.",        tag: "6 topics",  color: COLORS.linux },
    { id: "terraform", icon: "🏗️", title: "Terraform IaC",     desc: "Provision AWS with code. State, modules, workspaces, remote backends.", tag: "5 topics",  color: COLORS.terraform },
    { id: "kafka",     icon: "📨", title: "Apache Kafka",       desc: "Topics, partitions, consumers, producers, config tuning, lag.",         tag: "4 topics",  color: COLORS.kafka },
    { id: "boto3",     icon: "☁️", title: "Boto3 Deep Dive",    desc: "Python AWS SDK — S3, EC2, Lambda, DynamoDB, IAM, SQS.",                 tag: "5 topics",  color: COLORS.boto3 },
    { id: "networking",icon: "🌐", title: "Networking & Cloud", desc: "VPC, subnets, security groups, Route 53, VPN, peering, Azure VNet.",    tag: "5 topics",  color: COLORS.networking },
    { id: "cheatsheet",icon: "📋", title: "Quick Cheatsheet",   desc: "All commands in one place — Linux, Terraform, Kafka, Boto3.",           tag: "All-in-one",color: COLORS.cheatsheet },
  ];

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto", padding: "64px 24px" }}>
      <div style={{
        fontFamily: "monospace", fontSize: 11, letterSpacing: 3,
        textTransform: "uppercase", color: "#5a6ea0", marginBottom: 16,
      }}>
        // devops command center v2025
      </div>
      <h1 style={{
        fontFamily: "'Syne', 'Segoe UI', sans-serif",
        fontWeight: 800, fontSize: "clamp(34px, 6vw, 72px)",
        color: "#fff", lineHeight: 1.05, marginBottom: 20,
      }}>
        Master{" "}
        <span style={{ color: COLORS.linux }}>Linux</span>,<br />
        Terraform, Kafka<br />
        & <span style={{ color: COLORS.boto3 }}>Boto3</span>
      </h1>
      <p style={{ color: "#5a6ea0", fontSize: 15, maxWidth: 520, marginBottom: 52, lineHeight: 1.7 }}>
        Real commands, real scenarios — AWS S3 → Azure → Ubuntu, all explained with code snippets that actually work.
      </p>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
        gap: 16,
      }}>
        {cards.map(card => (
          <HomeCard key={card.id} {...card} onClick={() => onNavigate(card.id)} />
        ))}
      </div>
    </div>
  );
}

function HomeCard({ icon, title, desc, tag, color, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "#090d1a",
        border: `1px solid ${hovered ? "#243060" : "#1c2540"}`,
        borderRadius: 16, padding: 24, cursor: "pointer",
        transform: hovered ? "translateY(-3px)" : "none",
        boxShadow: hovered ? "0 12px 40px rgba(0,0,0,.4)" : "none",
        transition: "all .2s", position: "relative", overflow: "hidden",
      }}>
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0,
        height: 2, background: color, opacity: 0.7,
      }} />
      <div style={{ fontSize: 32, marginBottom: 12 }}>{icon}</div>
      <div style={{
        fontFamily: "'Syne', 'Segoe UI', sans-serif",
        fontWeight: 700, fontSize: 17, color: "#fff", marginBottom: 6,
      }}>
        {title}
      </div>
      <div style={{ fontSize: 13, color: "#5a6ea0", lineHeight: 1.65 }}>{desc}</div>
      <div style={{
        display: "inline-flex", alignItems: "center",
        marginTop: 14, padding: "3px 10px", borderRadius: 20,
        fontSize: 10, fontFamily: "monospace",
        background: "rgba(0,0,0,.3)",
        border: "1px solid #243060", color: "#5a6ea0",
      }}>
        {tag}
      </div>
    </div>
  );
}

// ─── APP ROOT ──────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("home");

  const SECTIONS = ["linux", "terraform", "kafka", "boto3", "networking"];

  const navItems = [
    { id: "home",       label: "Home",       dot: "#fff" },
    { id: "linux",      label: "Linux",      dot: COLORS.linux },
    { id: "terraform",  label: "Terraform",  dot: COLORS.terraform },
    { id: "kafka",      label: "Kafka",      dot: COLORS.kafka },
    { id: "boto3",      label: "Boto3",      dot: COLORS.boto3 },
    { id: "networking", label: "Networking", dot: COLORS.networking },
    { id: "cheatsheet", label: "📋 Cheat",   dot: null },
  ];

  return (
    <div style={{ background: "#05080f", minHeight: "100vh", color: "#9aaed4", fontFamily: "'Bricolage Grotesque', 'Segoe UI', sans-serif" }}>
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=JetBrains+Mono:wght@400;500&family=Bricolage+Grotesque:wght@400;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-track{background:#090d1a}
        ::-webkit-scrollbar-thumb{background:#243060;border-radius:4px}
        pre{margin:0}
      `}</style>

      {/* Nav */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(9,13,26,.95)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid #1c2540",
        padding: "0 18px", height: 54,
        display: "flex", alignItems: "center", gap: 6,
      }}>
        <div style={{
          fontFamily: "'Syne', sans-serif", fontWeight: 800,
          fontSize: 13, color: "#00e5a0", letterSpacing: 1,
          marginRight: 10, whiteSpace: "nowrap", cursor: "pointer",
        }} onClick={() => setPage("home")}>
          ⚡ <span style={{ color: "#fff" }}>DevOps</span>CMD
        </div>
        {navItems.map(item => (
          <NavButton key={item.id} item={item} active={page === item.id} onClick={() => setPage(item.id)} />
        ))}
      </nav>

      {/* Page content */}
      {page === "home" && <HomePage onNavigate={setPage} />}
      {SECTIONS.includes(page) && <TopicView key={page} section={page} color={COLORS[page]} />}
      {page === "cheatsheet" && <CheatsheetView />}
    </div>
  );
}

function NavButton({ item, active, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: "5px 14px", borderRadius: 8,
        border: `1px solid ${active || hovered ? "#243060" : "transparent"}`,
        background: active || hovered ? "#0d1221" : "transparent",
        color: active ? "#fff" : hovered ? "#dce8ff" : "#5a6ea0",
        fontFamily: "monospace", fontSize: 11,
        cursor: "pointer", transition: "all .18s",
        whiteSpace: "nowrap",
        display: "flex", alignItems: "center", gap: 5,
      }}>
      {item.dot && (
        <span style={{
          width: 7, height: 7, borderRadius: "50%",
          background: item.dot, flexShrink: 0, display: "inline-block",
        }} />
      )}
      {item.label}
    </button>
  );
}
