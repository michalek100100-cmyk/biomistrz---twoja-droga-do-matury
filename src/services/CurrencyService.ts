import { Language } from '../translations/types';

export class CurrencyTranslator {
    private static exchangeRates: Record<Language, { rate: number; symbol: string }> = {
        pl: { rate: 1, symbol: 'PLN' },
        en: { rate: 0.25, symbol: '$' },
        de: { rate: 0.23, symbol: '€' },
        es: { rate: 0.23, symbol: '€' },
        cz: { rate: 5.8, symbol: 'Kč' },
        jp: { rate: 37.0, symbol: '¥' },
        ch: { rate: 1.8, symbol: '¥' }
    };

    /**
     * Converts PLN amount to target currency based on language.
     */
    static convert(plnAmount: number, lang: Language): { value: number; symbol: string } {
        const config = this.exchangeRates[lang] || this.exchangeRates.pl;
        return {
            value: plnAmount * config.rate,
            symbol: config.symbol
        };
    }

    /**
     * Formats the converted amount as a string.
     */
    static format(plnAmount: number, lang: Language): string {
        const { value, symbol } = this.convert(plnAmount, lang);

        // If value is very small, we need more decimals to avoid "0.00"
        let precision = 2;
        if (value > 0 && value < 0.01) {
            precision = 4; // Show more digits for very small conversions (like 0.02 PLN to EUR/USD)
        } else if (value % 1 === 0) {
            precision = 0;
        }

        const formattedValue = value.toLocaleString(undefined, {
            minimumFractionDigits: precision,
            maximumFractionDigits: precision
        });

        if (lang === 'pl') {
            return `${formattedValue} ${symbol}`;
        }
        return `${symbol}${formattedValue}`;
    }

    /**
     * Replaces placeholders in a translation string with formatted currency.
     */
    static translateSupportString(template: string, plnAmount: number, lang: Language): string {
        return template.replace('$1', this.format(plnAmount, lang));
    }
}
