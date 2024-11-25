chrome.downloads.onDeterminingFilename.addListener(function(downloadItem, suggest) {
    let handled = false;

    chrome.storage.sync.get(['expressions'], function(result) {
        if (handled) return;

        const expressions = result.expressions || [];
        let newFilename = downloadItem.filename;
        
        if (expressions.length > 0) {
            expressions.forEach(expr => {
                if (expr.what && expr.what.trim()) {
                    const pattern = escapeRegExp(expr.what.trim());
                    const replacement = expr.forWhat || '';
                    const regex = new RegExp(pattern, 'gi');
                    
                    if (regex.test(newFilename)) {
                        newFilename = newFilename.replace(regex, replacement);
                    }
                }
            });
        }

        if (newFilename !== downloadItem.filename) {
            handled = true;
            suggest({
                filename: newFilename,
                conflict_action: 'uniquify',
                conflictAction: 'uniquify'
            });
        } else {
            handled = true;
            suggest({
                filename: downloadItem.filename,
                conflict_action: 'uniquify',
                conflictAction: 'uniquify'
            });
        }
    });

    return true;
});

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
