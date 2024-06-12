const url = new URL(document.URL);
const lastActiveTabUrl = url.searchParams.get('lastActiveTabUrl')!;

console.log(`Finding history for ${lastActiveTabUrl}`)

chrome.history.getVisits({ url: lastActiveTabUrl })
      .then(async (visits) => {
        for await (const visit of visits) {
            console.log(visit)
        }
      })