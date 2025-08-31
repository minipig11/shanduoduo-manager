// 获取URL参数
function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    const results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

// 检查文件是否为图片
function isImageFile(filename) {
    return /\.(jpg|jpeg|png|gif)$/i.test(filename);
}

function loadBucketScript(bucketName) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = `http://shanduoduo.sicilyhuang.top/api/oss/${bucketName}/v0list.js`;
        script.dataset.bucketScript = 'true';
        
        // Initialize module if it doesn't exist
        if (!window.module) {
            window.module = {};
        }
        
        script.onload = () => {
            if (window.module && Array.isArray(window.module.exports)) {
                // Ensure each item is a string
                window.imageList = window.module.exports.map(item => 
                    typeof item === 'string' ? item : item.name || ''
                ).filter(name => name); // Remove empty names
                window.currentBucket = bucketName;
                resolve();
            } else {
                reject(new Error('Invalid data format'));
            }
        };
        
        script.onerror = () => reject(new Error('Failed to load script'));
        document.head.appendChild(script);
    });
}


// Update bucket selector handler
function initBucketSelector() {
    const select = document.getElementById('bucketSelect');
    const button = document.getElementById('loadImages');
    
    if (!select || !button) {
        console.error('Required elements not found');
        return;
    }
    
    button.addEventListener('click', async () => {
        const selectedBucket = select.value;
        button.disabled = true;
        showSpinner();
        
        try {
            await loadBucketScript(selectedBucket);
            await initPage(selectedBucket);
        } catch (error) {
            console.error('Failed to load bucket data:', error);
        } finally {
            hideSpinner();
            button.disabled = false;
        }
    });
}

function showSpinner() {
    document.getElementById('spinner').classList.add('loading');
    document.getElementById('imageGrid').style.opacity = '0.5';
}

function hideSpinner() {
    document.getElementById('spinner').classList.remove('loading');
    document.getElementById('imageGrid').style.opacity = '1';
}


// 修改 initPage 接受 bucket 参数
function initPage(bucketName = 'liulantupian') {
    if (!window.imageList || !Array.isArray(window.imageList)) {
        console.error('Invalid image list data');
        return;
    }

    const imageGrid = document.getElementById('imageGrid');
    if (!imageGrid) return;

    imageGrid.innerHTML = '';
    
    window.imageList.forEach(imageName => {
        if (!imageName) return;
        
        const imageItem = document.createElement('div');
        imageItem.className = 'image-item';
        const isImage = isImageFile(imageName);
        const imageUrl = `http://shanduoduo.sicilyhuang.top/api/oss/${bucketName}/images/${imageName}`;
        
        imageItem.innerHTML = `
            <div class="image-wrapper">
                <a href=imageUrl target="_blank" rel="noopener noreferrer">
                    <img src="${imageUrl}" 
                         alt="${imageName}" 
                         class="${isImage ? 'image-preview' : ''}"
                         ${isImage ? 'data-image="true"' : ''}>
                </a>
                <button class="delete-button" data-image="${imageName}">删除</button>
            </div>
        `;
        imageGrid.appendChild(imageItem);
        
        // Add delete handler
        const deleteButton = imageItem.querySelector('.delete-button');
        deleteButton.addEventListener('click', async (e) => {
            e.preventDefault();
            if (!confirm('确定要删除这张图片吗？')) return;
            
            try {
                const response = await fetch(`http://shanduoduo.sicilyhuang.top/api/oss/${bucketName}/images/${imageName}`, {
                    method: 'DELETE',
                });
                
                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.message || '删除失败');
                }
                
                await response.json();
                alert('删除成功');
                
                // Reload the current page
                window.location.reload();
            } catch (error) {
                console.error('删除失败:', error);
                alert('删除失败: ' + error.message);
            }
        });
    });
}

// 仅初始化选择器，不自动加载图片
document.addEventListener('DOMContentLoaded', () => {
    initBucketSelector();
});