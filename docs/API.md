# VetPro API Documentation

## Authentication

### Register
`POST /api/auth/register`

### Login
`POST /api/auth/login`

## Clients
`GET /api/clients` - List all clients
`POST /api/clients` - Create client
`GET /api/clients/:id` - Get client
`PUT /api/clients/:id` - Update client
`DELETE /api/clients/:id` - Delete client

## Appointments
`GET /api/appointments` - List appointments
`POST /api/appointments` - Create appointment
`PUT /api/appointments/:id` - Update appointment
`DELETE /api/appointments/:id` - Cancel appointment

## Invoices
`GET /api/invoices` - List invoices
`POST /api/invoices` - Create invoice
`POST /api/invoices/:id/approve` - Approve invoice
`PUT /api/invoices/:id` - Update invoice
