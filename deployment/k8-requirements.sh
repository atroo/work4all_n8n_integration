#!/bin/sh
kubectl create namespace n8n-prod
kubectl label namespace n8n-prod \
  environment=production \
  app.kubernetes.io/part-of=n8n

kubectl create secret generic n8n-db-app-user \
  --namespace n8n-prod \
  --from-literal=username=n8n \
  --from-literal=password="$(openssl rand -base64 32)" \
  --type=kubernetes.io/basic-auth

  # Valkey Auth-Secret — Key-Name muss mit Username matchen (default)
kubectl create secret generic valkey-auth \
  --namespace n8n-prod \
  --from-literal=default="$(openssl rand -base64 32)"

# 1. n8n Encryption Key (kritisch! Verliert man den, sind alle gespeicherten Credentials weg)
kubectl create secret generic n8n-secrets \
  --namespace n8n-prod \
  --from-literal=N8N_ENCRYPTION_KEY="$(openssl rand -hex 32)" \
  --from-literal=N8N_HOST="n8n.local" \
  --from-literal=N8N_PORT="5678" \
  --from-literal=N8N_PROTOCOL="http"

# 2. Task Runner Auth Token
kubectl create secret generic n8n-runner-token \
  --namespace n8n-prod \
  --from-literal=auth-token="$(openssl rand -base64 32)"

# 3. Valkey Password Secret für n8n
# n8n braucht das Passwort in einem eigenen Secret (kann nicht direkt auf valkey-auth referenzieren)
VALKEY_PASS=$(kubectl get secret valkey-auth -n n8n-prod -o jsonpath='{.data.default}' | base64 -d)
kubectl create secret generic n8n-redis-password \
  --namespace n8n-prod \
  --from-literal=password="$VALKEY_PASS"