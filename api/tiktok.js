export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    let { url, platform } = req.query;
    
    if (!url) return res.status(400).json({ error: 'URL is required' });

    try {
        // ============ FACEBOOK - নিউ API ============
        if (url.includes('facebook.com') || url.includes('fb.watch') || platform === 'facebook') {
            
            // API 1: fbdown.net
            try {
                const apiUrl = `https://fbdown.net/download.php?url=${encodeURIComponent(url)}`;
                const response = await fetch(apiUrl);
                const html = await response.text();
                
                const hdMatch = html.match(/https:\/\/[^"'\s]+\.fbcdn\.net[^"'\s]*\.mp4[^"'\s]*/i);
                if (hdMatch) {
                    return res.json({
                        success: true,
                        platform: 'facebook',
                        title: 'Facebook Video',
                        thumbnail: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=400',
                        video: hdMatch[0],
                        hdvideo: hdMatch[0]
                    });
                }
            } catch (e) {
                console.log('FB API 1 failed');
            }
            
            // API 2: fb.watch
            try {
                const apiUrl = `https://api.fb.watch/api/download?url=${encodeURIComponent(url)}`;
                const response = await fetch(apiUrl);
                const data = await response.json();
                
                if (data.url) {
                    return res.json({
                        success: true,
                        platform: 'facebook',
                        title: 'Facebook Video',
                        thumbnail: data.thumbnail || '',
                        video: data.url,
                        hdvideo: data.hd_url || data.url
                    });
                }
            } catch (e) {
                console.log('FB API 2 failed');
            }
        }
        
        // ============ INSTAGRAM ============
        else if (url.includes('instagram.com') || platform === 'instagram') {
            try {
                const apiUrl = `https://api.instagramdownloader.net/api/instagram/post?url=${encodeURIComponent(url)}`;
                const response = await fetch(apiUrl);
                const data = await response.json();
                
                if (data.url) {
                    return res.json({
                        success: true,
                        platform: 'instagram',
                        title: 'Instagram Video',
                        thumbnail: data.thumbnail || 'https://images.unsplash.com/photo-1611262588024-d12430b98920?w=400',
                        video: data.url,
                        hdvideo: data.hd_url || data.url
                    });
                }
            } catch (e) {
                console.log('Instagram API error:', e.message);
            }
        }
        
        // ============ TIKTOK ============
        else if (url.includes('tiktok.com') || platform === 'tiktok') {
            // vt.tiktok.com fix
            if (url.includes('vt.tiktok.com')) {
                const response = await fetch(url, { 
                    method: 'HEAD', 
                    redirect: 'follow' 
                });
                url = response.url;
            }
            
            const response = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}&hd=1`);
            const data = await response.json();
            
            if (data.code === 0) {
                return res.json({
                    success: true,
                    platform: 'tiktok',
                    title: data.data.title || 'TikTok Video',
                    thumbnail: data.data.cover,
                    video: data.data.play,
                    hdvideo: data.data.hdplay
                });
            }
        }
        
        return res.json({ success: false, error: 'Video not found' });
        
    } catch (error) {
        console.error('API Error:', error.message);
        return res.status(500).json({ success: false, error: error.message });
    }
}
