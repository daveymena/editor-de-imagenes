# VisionEdit AI - Proyecto Completado

He creado el editor de texto avanzado solicitado directamente en tu **Escritorio**. Este editor combina OCR de alto nivel con integración de IA local.

## Ubicación del Proyecto
- Carpeta: [vision-edit-ai](file:///C:/Users/a-ndr/Desktop/vision-edit-ai/)
- Archivo principal: [index.html](file:///C:/Users/a-ndr/Desktop/vision-edit-ai/index.html)

## Características Implementadas
1.  **Conversión Imagen a Texto (Mantenimiento de Estética)**: 
    - Al subir un JPG, el motor de OCR (Tesseract.js) detecta cada línea de texto y su posición exacta.
    - Se crea una capa invisible de cuadros editables sobre la imagen original. Al hacer clic, puedes editar el texto sin alterar el diseño visual de fondo.
2.  **Interfaz Premium**: 
    - Estética Dark Mode con efectos de desenfoque de cristal (glassmorphism).
    - Animaciones suaves y carga visual para procesos pesados.
3.  **Integración con Ollama**:
    - Panel lateral para enviar instrucciones a la IA (ej: "Mejora la redacción", "Resume").
    - Se comunica con `http://localhost:11434` (Ollama local).
4.  **Exportación**: 
    - Opción para descargar el contenido editado en formato `.txt`.

## Instrucciones para Ollama
Para que la integración con la IA funcione, asegúrate de:
1.  Tener Ollama instalado y corriendo.
2.  Configurar los orígenes permitidos (CORS) ejecutando esto en una terminal antes de abrir Ollama:
    ```powershell
    $env:OLLAMA_ORIGINS="*"; ollama serve
    ```
3.  Tener el modelo `llama3` descargado (`ollama pull llama3`).

## Verificación Visual
Puedes abrir el archivo `index.html` en cualquier navegador moderno para comenzar a editar tus imágenes.
