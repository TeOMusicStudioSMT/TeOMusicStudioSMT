# 🧠 Katalog wag MiniMax-Music-3

**Ten katalog jest pusty w repozytorium — i tak ma być.** Wagi ważą 16+ GB, więc
nie jadą przez gita (patrz `.gitignore`). Ten plik README to jedyny wyjątek.

Dzięki temu moduł da się zminiaturyzować na **otakos.wtf**: kod leci lekki (~1 MB),
a Suweren dociąga wagi po pierwszej instalacji.

## Jak pobrać wagi

**Z aplikacji:** TeO Music V2 → `AI Session` → zakładka **Katalog Modeli**.
Zestaw **„Lekki 0.00G"** to jedyny, który realnie chodzi na 6 GB VRAM.

**Z terminala** (przez Wiesio-Bridge na `:3001`):

```bash
curl -X POST http://127.0.0.1:3001/api/music/models/pull -H "Content-Type: application/json" -d "{\"ids\":[\"dit-int8\",\"text-encoder-pruned-int8\",\"dav\"]}"
```

Stan katalogu:

```bash
curl http://127.0.0.1:3001/api/music/models
```

Pobieranie leci w tle, zapisuje do `.part` i **wznawia się po zerwaniu** (HTTP Range).
Plik dostaje właściwą nazwę dopiero gdy rozmiar zgadza się co do bajta — przerwane
pobieranie nigdy nie udaje kompletnego modelu.

## Układ katalogu

Layout jest 1:1 z repo [`Comfy-Org/MiniMax-Music-3`](https://huggingface.co/Comfy-Org/MiniMax-Music-3),
czyli też 1:1 z układem `ComfyUI/models/`:

```
models/
├── diffusion_models/   ← rdzeń DiT (int8 / fp16 / fp32)
├── text_encoders/      ← encoder opisu i tekstu piosenki
└── vae/                ← DAV, dekoder audio (bez niego nie ma dźwięku)
```

Pipeline potrzebuje **po jednym pliku z każdej z trzech rol**.

## Kto to liczy

Wagi są repackami Comfy-Org (mają w metadanych `comfy_model`), więc liczy je
**ComfyUI**, a nie własny pipeline. Katalog zostaje suwerenny tutaj — ComfyUI tylko
go czyta przez `extra_model_paths.yaml`, żeby nie trzymać 16 GB w dwóch miejscach.

Manifest (co, skąd, ile waży) jest w [`src/services/musicModelCatalog.ts`](../src/services/musicModelCatalog.ts)
i po stronie mostu w `TeO_Genesis/services/MuzykaModeleService.js`. Rozmiary są
zweryfikowane przez HuggingFace API, nie zgadnięte.
