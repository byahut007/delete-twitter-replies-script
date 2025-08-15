async function deleteMyRepliesWithDebug(n, myUsername) {
    console.log(`Starting to delete ${n} of ${myUsername}'s replies...`);
    
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    async function scrollToLoadMore() {
        const previousHeight = document.documentElement.scrollHeight;
        window.scrollTo(0, document.documentElement.scrollHeight);
        await sleep(2000); // Wait for new content to load
        const newHeight = document.documentElement.scrollHeight;
        return newHeight > previousHeight; // Returns true if new content was loaded
    }
    
    // Function to extract tweet text from an article element
    function getTweetText(article) {
        // Try to find the tweet text in various possible locations
        const tweetTextElement = article.querySelector('[data-testid="tweetText"]') || 
                                article.querySelector('[lang]') ||
                                article.querySelector('div[dir="auto"]');
        
        if (tweetTextElement) {
            return tweetTextElement.textContent.trim();
        }
        
        // Fallback: look for any div with substantial text
        const divs = article.querySelectorAll('div');
        for (let div of divs) {
            const text = div.textContent.trim();
            if (text.length > 20 && !text.includes('Follow') && !text.includes('Retweet')) {
                return text.substring(0, 200) + (text.length > 200 ? '...' : '');
            }
        }
        
        return "Could not extract tweet text";
    }
    
    let deletedCount = 0;
    let noRepliesFoundCount = 0;
    
    while (deletedCount < n) {
        try {
            // Find all tweet articles
            const articles = document.querySelectorAll('article');
            let foundMyReply = false;
            
            // Skip first article (original post) and look for your replies
            for (let i = 1; i < articles.length; i++) {
                const article = articles[i];
                
                // Check if this article contains your username
                const userLinks = article.querySelectorAll('a[href*="/" + myUsername + ""]');
                const hasMyUsername = userLinks.length > 0;
                
                // Also check for the menu button
                const menuButton = article.querySelector('[data-testid="caret"]');
                
                if (hasMyUsername && menuButton) {
                    // Extract and display the reply text before deletion
                    const replyText = getTweetText(article);
                    console.log(`\n📝 Found your reply at position ${i}`);
                    console.log(`📄 Reply content: "${replyText}"`);
                    
                    foundMyReply = true;
                    noRepliesFoundCount = 0; // Reset counter
                    
                    // Click menu
                    menuButton.click();
                    await sleep(1500);
                    
                    // Find and click Delete
                    const menuItems = document.querySelectorAll('[role="menuitem"]');
                    let deleteFound = false;
                    
                    for (let item of menuItems) {
                        if (item.textContent && item.textContent.includes('Delete')) {
                            item.click();
                            deleteFound = true;
                            console.log("🗑️  Clicked Delete option");
                            break;
                        }
                    }
                    
                    if (!deleteFound) {
                        console.log("❌ No delete option - skipping (might not be your reply)");
                        document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
                        await sleep(500);
                        continue;
                    }
                    
                    await sleep(1000);
                    
                    // Confirm deletion
                    const confirmBtn = document.querySelector('[data-testid="confirmationSheetConfirm"]');
                    if (confirmBtn) {
                        confirmBtn.click();
                        deletedCount++;
                        console.log(`✅ Successfully deleted reply ${deletedCount} of ${n}`);
                        console.log(`   Deleted text: "${replyText.substring(0, 100)}${replyText.length > 100 ? '...' : ''}"`); 
                        console.log('---'.repeat(20));
                        await sleep(3000);
                        break; // Start over from the beginning
                    } else {
                        console.log("❌ Couldn't find confirm button");
                        // Try to close dialog
                        document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
                        await sleep(500);
                    }
                }
            }
            
            if (!foundMyReply) {
                noRepliesFoundCount++;
                console.log("\n🔍 No more of your replies found on current view");
                
                // Try scrolling to load more content
                if (noRepliesFoundCount < 3) { // Try scrolling up to 3 times
                    console.log("📜 Scrolling to load more replies...");
                    const loadedMore = await scrollToLoadMore();
                    
                    if (loadedMore) {
                        console.log("✅ New content loaded, continuing search...");
                        await sleep(1000);
                    } else {
                        console.log("📭 No more content to load");
                        break;
                    }
                } else {
                    console.log("🛑 Tried scrolling multiple times, no more replies found");
                    break;
                }
            }
            
        } catch (error) {
            console.error("❌ Error:", error);
            await sleep(1000);
        }
    }
    
    console.log(`\n${'==='.repeat(15)}`);
    console.log(`🎯 DELETION COMPLETE: Deleted ${deletedCount} replies`);
    if (deletedCount < n) {
        console.log(`📝 Note: Only found ${deletedCount} replies to delete (requested ${n})`);
    }
    console.log(`${'==='.repeat(15)}`);
}

// Usage - replace 'username' with your actual username
deleteMyRepliesWithDebug(10, 'username');
