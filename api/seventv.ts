/*
* Vencord, a Discord client mod
* Copyright (c) 2024 jesusqc
* SPDX-License-Identifier: GPL-3.0-or-later
*/

const API_ENDPOINT = "https://7tv.io/v4/gql";

const SEARCH_FIRST_EMOTE_QUERY = `
    query SearchEmote($query: String!) {
        search {
            all(query: $query, page: 1, perPage: 1) {
                emotes {
                    items {
                        id
                    }
                }
            }
        }
    }
`;

const SEARCH_EMOTES_QUERY = `
    query SearchEmote($query: String!, $perPage: Int!) {
        search {
            all(query: $query, page: 1, perPage: $perPage) {
                emotes {
                    items {
                        id
                        defaultName
                    }
                }
            }
        }
    }
`;

const createRequestBody = (query: string, variables: object) => ({
    operationName: 'SearchEmote',
    query: query,
    variables: variables
});

export const searchFirstEmote = async (emoteName: string) => {
    try {
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(createRequestBody(SEARCH_FIRST_EMOTE_QUERY, { query: emoteName }))
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const firstEmote = data.data?.search?.all?.emotes?.items[0];

        return firstEmote ? firstEmote.id : null;
    } catch (error) {
        console.error("Error searching for emote:", error);
        return null;
    }
};

export interface EmoteItem {
    id: string;
    defaultName?: string;
}

export interface SearchResponse {
    data?: {
        search?: {
            all?: {
                emotes?: {
                    items: EmoteItem[];
                };
            };
        };
    };
}

export const searchEmotes = async (emoteName: string, perPage: number = 5): Promise<EmoteItem[] | null> => {
    try {
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(createRequestBody(SEARCH_EMOTES_QUERY, { query: emoteName, perPage: perPage }))
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json() as SearchResponse;
        const emotes = data.data?.search?.all?.emotes?.items;

        return emotes || null;
    } catch (error) {
        console.error("Error searching for emotes:", error);
        return null;
    }
};

export const emoteSearchReplacer = async (message: string): Promise<string> => {
    try {
        const emote = await searchFirstEmote(message);
        return emote ? formatEmote(emote) : "";
    } catch (error) {
        console.error("Error searching for emote:", error);
        return message;
    }
};

export const formatEmote = (emoteId: string) => `https://cdn.7tv.app/emote/${emoteId}/2x.webp`;
