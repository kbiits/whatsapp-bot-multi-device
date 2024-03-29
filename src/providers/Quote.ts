import axios from 'axios';

interface Quote {
  getRandomQuote(): Promise<string>;
}

const quoteNotFound = `Sorry, I don't have any quotes for you now`;

class BadQuoteProvider implements Quote {
  API_URL = 'https://breaking-bad-quotes.herokuapp.com/v1/quotes';

  async getRandomQuote(): Promise<string> {
    let dataFix: string;
    try {
      const { data } = await axios.get('https://breaking-bad-quotes.herokuapp.com/v1/quotes'); // get random bad quotes
      if (!Array.isArray(data) || !data.length) {
        return quoteNotFound;
      }
      const quote = data[0];
      dataFix = `${quote.quote}\n\n-- ${quote.author} --`;
    } catch {}
    if (!dataFix) return quoteNotFound;
    return dataFix;
  }
}

class CommonQuoteProvider implements Quote {
  API_URL = 'https://api.quotable.io/random';

  async getRandomQuote(): Promise<string> {
    let dataFix: string;
    try {
      const { data } = await axios.get('https://api.quotable.io/random');
      dataFix = `${data.content}\n\n-- ${data.author} --`;
    } catch {}
    if (!dataFix) {
      return quoteNotFound;
    }
    return dataFix;
  }
}

type QuoteProviderFactory = {
  [key: string]: () => Quote;
};

const QuoteProviderFactory: QuoteProviderFactory = {
  '1': (): Quote => new CommonQuoteProvider(),
  '2': (): Quote => new BadQuoteProvider(),
};

export const getRandomQuoteProvider = (): Quote => {
  const listKeys = Object.keys(QuoteProviderFactory);
  const ConcreteQuoteProvider: Quote = QuoteProviderFactory[listKeys[Math.floor(Math.random() * listKeys.length)]]();
  return ConcreteQuoteProvider;
};
