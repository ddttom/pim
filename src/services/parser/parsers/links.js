export default {
  parse(text) {
    const result = {
      text,
      links: []
    };

    // Parse web links
    const webLinks = [...text.matchAll(/https?:\/\/[^\s]+/g)];
    webLinks.forEach(match => {
      result.links.push({
        type: 'web',
        url: match[0]
      });
    });

    // Parse file links
    const fileLinks = [...text.matchAll(/file:\/\/[^\s]+/g)];
    fileLinks.forEach(match => {
      result.links.push({
        type: 'file',
        url: match[0]
      });
    });

    return result;
  }
};
