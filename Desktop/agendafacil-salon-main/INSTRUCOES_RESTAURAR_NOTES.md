# Como Restaurar o Campo Notes

## Passo 1: Resolver Cache do Schema no Supabase

1. **Acesse o Supabase Dashboard**
2. **Vá para SQL Editor**
3. **Execute este comando:**
```sql
NOTIFY pgrst, 'reload schema';
```
4. **Aguarde alguns segundos**

## Passo 2: Restaurar a Linha no Código

Após executar o comando acima, você deve:

1. **Abrir o arquivo:** `src/pages/PublicBooking.tsx`
2. **Localizar a linha 346** (aproximadamente)
3. **Adicionar de volta a linha:**
```javascript
notes: bookingData.notes,
```

### Localização Exata:
Procure por este bloco de código:
```javascript
.insert({
  salon_id: salon?.id,
  service_id: bookingData.serviceId,
  client_name: bookingData.clientName,
  client_email: bookingData.clientEmail,
  client_phone: bookingData.clientPhone,
  appointment_date: bookingData.appointmentDate,
  appointment_time: bookingData.appointmentTime,
  duration_minutes: selectedService.duration_minutes,
  total_price: selectedService.price,
  status: 'scheduled'
});
```

E adicione `notes: bookingData.notes,` antes de `status: 'scheduled'`

## Resultado Final:
```javascript
.insert({
  salon_id: salon?.id,
  service_id: bookingData.serviceId,
  client_name: bookingData.clientName,
  client_email: bookingData.clientEmail,
  client_phone: bookingData.clientPhone,
  appointment_date: bookingData.appointmentDate,
  appointment_time: bookingData.appointmentTime,
  duration_minutes: selectedService.duration_minutes,
  total_price: selectedService.price,
  notes: bookingData.notes,
  status: 'scheduled'
});
```

## Teste
Após fazer essas alterações, teste criando um agendamento para verificar se o erro PGRST204 foi resolvido.