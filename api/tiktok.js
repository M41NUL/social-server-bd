export default async function handler(req, res) {
    // CORS fix
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    
    let { url, platform } = req.query;
    
    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    try {
        // ============ PLATFORM DETECTION ============
        // Facebook URL patterns
        if (url.includes('facebook.com') || url.includes('fb.watch') || url.includes('fb.com')) {
            platform = 'facebook';
        }
        // Instagram URL patterns
        else if (url.includes('instagram.com') || url.includes('instagr.am')) {
            platform = 'instagram';
        }
        // TikTok URL patterns
        else if (url.includes('tiktok.com') || url.includes('vt.tiktok.com')) {
            platform = 'tiktok';
            // Handle vt.tiktok.com short links
            if (url.includes('vt.tiktok.com')) {
                const response = await fetch(url, { 
                    method: 'HEAD', 
                    redirect: 'follow' 
                });
                url = response.url;
            }
        }
        
        // ============ TIKTOK ============
        if (platform === 'tiktok') {
            const response = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}&hd=1`);
            const data = await response.json();
            
            if (data.code === 0) {
                return res.json({
                    success: true,
                    platform: 'tiktok',
                    title: data.data.title || 'TikTok Video',
                    thumbnail: data.data.cover,
                    video: data.data.play,
                    hdvideo: data.data.hdplay,
                    author: data.data.author?.nickname || 'TikTok User'
                });
            }
        }
        
        // ============ FACEBOOK ============
        else if (platform === 'facebook') {
            try {
                // Facebook API 1
                const apiUrl = `https://api.vevioz.com/api/button/facebook?url=${encodeURIComponent(url)}`;
                const response = await fetch(apiUrl);
                const html = await response.text();
                const match = html.match(/https?:\/\/[^"'\s]+\.mp4[^"'\s]*/i);
                
                if (match) {
                    return res.json({
                        success: true,
                        platform: 'facebook',
                        title: 'Facebook Video',
                        thumbnail: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=400',
                        video: match[0],
                        hdvideo: match[0]
                    });
                }
            } catch (e) {
                console.log('Facebook API error:', e);
            }
        }
        
        // ============ INSTAGRAM ============
        else if (platform === 'instagram') {
            try {
                // Instagram API
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
                console.log('Instagram API error:', e);
            }
        }
        
        return res.json({ 
            success: false, 
            error: 'Video not found or unsupported platform',
            platform: platform 
        });
        
    } catch (error) {
        console.error('API Error:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
}
