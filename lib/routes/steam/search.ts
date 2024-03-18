import type { Route } from '@/types';
import got from '@/utils/got';
import { load } from 'cheerio';
import qs from 'querystring';
import queryString from 'query-string';

export const route: Route = {
    path: '/search/:searchParams',
    categories: ['gaming'],
    example: '/steam/search/sort_by=Released_DESC&tags=492&category1=10&os=linux',
    parameters: { search: 'Search parameters for Steam Store search. ' },
    radar: [{
        source: ['store.steampowered.com'],
    }],
    name: 'Steam Store Search',
    maintainers: ['moppman'],
    handler,
};

async function handler(ctx) {
    const params = ctx.req.param('searchParams');
    const query = qs.parse(params);
    const { data: html } = await got(`https://store.steampowered.com/search/results`, {
        searchParams: queryString.stringify(query),
    });
    const $ = load(html);
    return {
        title: 'Steam search result',
        description: `Query: ${qs.stringify(query)}`,
        link: /g_strUnfilteredURL\s=\s'(.*)'/.exec(html)[1],
        item: $('#search_result_container a')
            .toArray()
            .map((a) => {
                const $el = $(a);
                const hasPrice = $el.find('.discount_final_price').length > 0;
                const hasReview = $el.find('.search_review_summary').length > 0;
                let desc = '';
                if (hasPrice) {
                    desc += `Price: ${$el.find('.discount_final_price').text().trim()}\n`;
                }
                if (hasReview) {
                    desc += `Reviews: ${$el.find('.search_review_summary').attr('data-tooltip-html')}`;
                }
                return {
                    title: $el.find('span.title').text(),
                    link: $el.attr('href'),
                    description: desc.replaceAll('\n', '<br>'),
                };
            })
            .filter((it) => it.title),
    };
}
