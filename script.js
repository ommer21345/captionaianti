document.addEventListener('DOMContentLoaded', () => {
    const uploadArea = document.getElementById('upload-area');
    const photoUpload = document.getElementById('photo-upload');
    const uploadPrompt = document.getElementById('upload-prompt');
    const imagePreview = document.getElementById('image-preview');
    const form = document.getElementById('generator-form');
    const generateBtn = document.getElementById('generate-btn');
    const btnText = document.getElementById('btn-text');
    const btnLoader = document.getElementById('btn-loader');
    const resultsSection = document.getElementById('results-section');
    const captionsContainer = document.getElementById('captions-container');

    // Handle image upload preview
    uploadArea.addEventListener('click', () => {
        photoUpload.click();
    });

    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = 'var(--primary-neon)';
    });

    uploadArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = 'var(--glass-border)';
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = 'var(--glass-border)';
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    });

    photoUpload.addEventListener('change', function() {
        if (this.files && this.files[0]) {
            handleFile(this.files[0]);
        }
    });

    function handleFile(file) {
        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file.');
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            imagePreview.src = e.target.result;
            imagePreview.classList.remove('hidden');
            uploadPrompt.classList.add('hidden');
        }
        reader.readAsDataURL(file);
    }

    // Handle form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const platform = document.getElementById('platform').value;
        const tone = document.getElementById('tone').value;
        const context = document.getElementById('context').value;
        const hasImage = !imagePreview.classList.contains('hidden');

        setLoading(true);

        try {
            const response = await fetch("/api/generate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    platform,
                    tone,
                    context,
                    hasImage
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'API request failed');
            }

            // Parse and display
            displayCaptions(data.captions);
            
        } catch (error) {
            console.error('Error:', error);
            alert(error.message || 'An error occurred while generating captions. Please try again.');
        } finally {
            setLoading(false);
        }
    });

    function setLoading(isLoading) {
        if (isLoading) {
            btnText.textContent = 'Generating...';
            btnLoader.classList.remove('hidden');
            generateBtn.disabled = true;
            resultsSection.classList.add('hidden');
        } else {
            btnText.textContent = 'Generate Captions';
            btnLoader.classList.add('hidden');
            generateBtn.disabled = false;
        }
    }

    function displayCaptions(textResponse) {
        captionsContainer.innerHTML = '';
        
        let captionsArr = textResponse.split('$$$').map(c => c.trim()).filter(c => c.length > 0);
        
        if (captionsArr.length < 2) {
            captionsArr = textResponse.split(/(?:\d+\.|\* \*\*Option \d+:\*\*)/).map(c => c.trim()).filter(c => c.length > 10);
            if (captionsArr.length === 0) {
                 captionsArr = [textResponse];
            }
        }

        captionsArr.slice(0, 5).forEach((caption) => {
            caption = caption.replace(/^\d+[\.\)\-]\s*/, '');
            
            const card = document.createElement('div');
            card.className = 'caption-card';
            
            const textEl = document.createElement('div');
            textEl.className = 'caption-text';
            textEl.textContent = caption;
            
            const copyBtn = document.createElement('button');
            copyBtn.className = 'copy-btn';
            copyBtn.textContent = 'Copy Text';
            
            copyBtn.addEventListener('click', () => {
                navigator.clipboard.writeText(caption).then(() => {
                    copyBtn.textContent = 'Copied!';
                    setTimeout(() => copyBtn.textContent = 'Copy Text', 2000);
                });
            });
            
            card.appendChild(textEl);
            card.appendChild(copyBtn);
            captionsContainer.appendChild(card);
        });

        resultsSection.classList.remove('hidden');
        resultsSection.scrollIntoView({ behavior: 'smooth' });
    }
});
