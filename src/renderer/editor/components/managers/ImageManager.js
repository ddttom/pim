import { showToast } from '../../../utils/toast.js';

export class ImageManager {
    constructor(editor) {
        this.editor = editor?.editor;
        if (!this.editor) {
            console.error('Editor core not initialized');
        }
    }

    createImageUpload() {
        const imageUpload = document.createElement('input');
        imageUpload.type = 'file';
        imageUpload.id = 'image-upload';
        imageUpload.accept = 'image/*';
        imageUpload.multiple = true;
        imageUpload.style.display = 'none';

        return imageUpload;
    }

    setupImageHandlers(imageBtn, imageUpload) {
        if (imageBtn && imageUpload) {
            imageBtn.addEventListener('click', () => {
                imageUpload.click();
            });

            imageUpload.addEventListener('change', async (e) => {
                const files = e.target.files;
                if (!files || files.length === 0) return;

                try {
                    for (const file of files) {
                        await this.handleImageUpload(file);
                    }
                } catch (error) {
                    console.error('Failed to upload image:', error);
                    showToast('Failed to upload image: ' + error.message, 'error');
                }

                // Clear input for next upload
                imageUpload.value = '';
            });
        }
    }

    handleImageUpload(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (event) => {
                try {
                    // Get base64 data URL
                    const dataUrl = event.target.result;
                    
                    // Create image element
                    const img = document.createElement('img');
                    img.src = dataUrl;
                    img.alt = file.name;
                    img.style.maxWidth = '100%';
                    img.style.height = 'auto';
                    
                    // Insert image at cursor position
                    if (this.editor?.preview) {
                        const selection = window.getSelection();
                        if (selection.rangeCount > 0) {
                            const range = selection.getRangeAt(0);
                            range.insertNode(img);
                            
                            // Move cursor after image
                            range.setStartAfter(img);
                            range.collapse(true);
                            selection.removeAllRanges();
                            selection.addRange(range);
                            
                            // Focus editor
                            this.editor.focus();
                        }
                    }
                    resolve();
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = () => {
                reject(new Error('Failed to read image file'));
            };
            
            reader.readAsDataURL(file);
        });
    }
}
