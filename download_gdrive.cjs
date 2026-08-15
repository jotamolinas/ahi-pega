const fs = require('fs');
const https = require('https');

function downloadFile(fileId, destPath) {
    const url = `https://drive.google.com/uc?export=download&id=${fileId}`;
    
    https.get(url, (res) => {
        if (res.statusCode === 303 || res.statusCode === 302 || res.statusCode === 301) {
            let redirectUrl = res.headers.location;
            if (!redirectUrl.startsWith('http')) {
                redirectUrl = `https://drive.google.com${redirectUrl}`;
            }
            https.get(redirectUrl, (res2) => {
                const fileStream = fs.createWriteStream(destPath);
                res2.pipe(fileStream);
                fileStream.on('finish', () => {
                    fileStream.close();
                    console.log('Download finished for', destPath);
                });
            });
        } else {
            const fileStream = fs.createWriteStream(destPath);
            res.pipe(fileStream);
            fileStream.on('finish', () => {
                fileStream.close();
                console.log('Download finished for', destPath);
            });
        }
    }).on('error', (err) => {
        console.error('Error downloading:', err.message);
    });
}

downloadFile('1q3gRH_HwnD2c05HO9tbJ-ue1dGHY79Qi', 'public/banner_footer_video.mp4');
// Need to find the IDs for banner_video.mp4 and banner_mid_video.mp4 from the previous prompts.
