const rp = require('request-promise');
const cheerio = require('cheerio');
const Table = require('cli-table');

let table = new Table({
  head: ['Clan name', 'High scorers', 'Clan link', 'Clan total trophies'],
  colWidths: [25, 15, 40, 25]
})

let clans = [];
const baseUrl = "http://royaleapi.com";
const options = {
  url: baseUrl + "/players/leaderboard/",
  transform: body => cheerio.load(body)
};

rp(options)
  .then($ => {
    const clanObjects = $('#roster tr td.mobile-hide a');
    clanObjects.each((index, object) => {
      let clanName = $(object).text();
      let existingClan = clans.find((clan) => clanName === clan.clanName);
      if (!existingClan)
      {
        clans.push({
          clanName: clanName,
          link: $(object).attr('href'),
          totalHighScorers: 1
        })
      }
      else
      {
        existingClan.totalHighScorers++;
      }
    });
    mergeClanTotalTrophis(clans)
  });

mergeClanTotalTrophis = (clans) => {
  let i = 0;
  function processNext () {
    if (i < clans.length)
    {
      const clan = clans[i];
      const options = {
        url: baseUrl + clan.link,
        transform: body => cheerio.load(body)
      };
      rp(options)
        .then($ => {
          const totalTrophies = $('.isotope-grid .content .value').eq(0).text();
          clan.totalClanTrophies = totalTrophies;
          table.push([clan.clanName.trim(), clan.totalHighScorers, options.url, clan.totalClanTrophies])
          i++;
          processNext();
        })
    }
    else
    {
      console.log(table.toString());
    }
  }
  processNext();
}
