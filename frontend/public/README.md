# Public assets

Salva qui il logo del Politecnico di Bari come `poliba-logo.png` (o `.svg`).

L'immagine è referenziata in `src/components/ChatInterface.jsx`:

```jsx
<img src="/poliba-logo.png" alt="Politecnico di Bari" />
```

Se il file non viene trovato, l'immagine viene nascosta automaticamente (gestione `onError`).
