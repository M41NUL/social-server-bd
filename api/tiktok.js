export default async function handler(req, res) {
    // CORS fix
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    
    let { url, platform } = req.query;
    
    if (!url) {
        return res.status(400).json({ success: false, error: 'URL is required' });
    }

    try {
        // ============ PLATFORM DETECTION ============
        if (url.includes('facebook.com') || url.includes('fb.watch') || url.includes('fb.com')) {
            platform = 'facebook';
        } else if (url.includes('instagram.com') || url.includes('instagr.am')) {
            platform = 'instagram';
        } else if (url.includes('tiktok.com') || url.includes('vt.tiktok.com')) {
            platform = 'tiktok';
        }
        
        // ============ FACEBOOK - NEW WORKING API ============
        if (platform === 'facebook') {
            try {
                // API 1: fdown.net
                const fdownUrl = `https://fdown.net/download.php?url=${encodeURIComponent(url)}`;
                const response = await fetch(fdownUrl);
                const html = await response.text();
                
                // HD quality link
                const hdMatch = html.match(/<a[^>]*href="([^"]*)"[^>]*>Download HD<\/a>/i);
                if (hdMatch && hdMatch[1]) {
                    return res.json({
                        success: true,
                        platform: 'facebook',
                        title: 'Facebook Video',
                        thumbnail: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=400',
                        video: hdMatch[1],
                        hdvideo: hdMatch[1]
                    });
                }
                
                // SD quality link
                const sdMatch = html.match(/<a[^>]*href="([^"]*)"[^>]*>Download SD<\/a>/i);
                if (sdMatch && sdMatch[1]) {
                    return res.json({
                        success: true,
                        platform: 'facebook',
                        title: 'Facebook Video',
                        thumbnail: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=400',
                        video: sdMatch[1],
                        hdvideo: sdMatch[1]
                    });
                }
            } catch (e) {
                console.log('Facebook API 1 failed:', e.message);
            }
            
            try {
                // API 2: snapinsta.app (Facebook support)
                const snapUrl = `https://snapinsta.app/api/ajaxFacebook?url=${encodeURIComponent(url)}`;
                const response = await fetch(snapUrl, {
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                });
                const data = await response.json();
                
                if (data && data.url) {
                    return res.json({
                        success: true,
                        platform: 'facebook',
                        title: 'Facebook Video',
                        thumbnail: data.thumbnail || '',
                        video: data.url,
                        hdvideo: data.url
                    });
                }
            } catch (e) {
                console.log('Facebook API 2 failed:', e.message);
            }
            
            // If both APIs fail, return error
            return res.json({ 
                success: false, 
                error: 'Facebook video not found. Please check the URL.' 
            });
        }
        
        // ============ INSTAGRAM - NEW WORKING API ============
        else if (platform === 'instagram') {
            try {
                // API: snapinsta.app
                const snapUrl = `https://snapinsta.app/api/ajaxInstagram?url=${encodeURIComponent(url)}`;
                const response = await fetch(snapUrl, {
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                });
                const data = await response.json();
                
                if (data && data.url) {
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
                console.log('Instagram API failed:', e.message);
            }
            
            return res.json({ 
                success: false, 
                error: 'Instagram video not found. Please check the URL.' 
            });
        }
        
        // ============ TIKTOK ============
        else if (platform === 'tiktok') {
            try {
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
                        hdvideo: data.data.hdplay,
                        author: data.data.author?.nickname || 'TikTok User'
                    });
                }
            } catch (e) {
                console.log('TikTok API failed:', e.message);
            }
            
            return res.json({ 
                success: false, 
                error: 'TikTok video not found. Please check the URL.' 
            });
        }
        
        return res.json({ success: false, error: 'Unsupported platform' });
        
    } catch (error) {
        console.error('API Error:', error.message);
        return res.status(500).json({ success: false, error: error.message });
    }
}
