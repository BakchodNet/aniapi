import axios from "axios";
import {
  InfoQuery,
  SearchQ,
  RecommendationsQuery,
  airingScheduleQuery,
} from "../model/aniquery.js";

const FetchAnilist = axios.create({
  baseURL: "https://graphql.anilist.co",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

const FetchMalSyncData = async (malid) => {
  const data = axios
    .get(`https://api.malsync.moe/mal/anime/${malid}`)
    .catch((err) => err.message);
  return data;
};

const getIDeachProvider = async (json) => {
  let idGogo = '""';
  let idZoro = '""';
  let id9anime = '""';
  let idPahe = '""';

  if (json.data.Sites.Gogoanime) {
    idGogo =
      JSON.stringify(json.data.Sites.Gogoanime)
        .match(/"identifier":"(.*?)"/)[1]
        .match(/(.*)/)[0] || "";
  }
  if (json.data.Sites.Zoro) {
    idZoro =
      JSON.stringify(json.data.Sites.Zoro)
        .match(/"url":"(.*?)"/)[1]
        .match(/(.*)/)[0]
        .replace("https://zoro.to/", "") || "";
  }
  if (json.data.Sites["9anime"]) {
    id9anime =
      JSON.stringify(json.data.Sites["9anime"])
        .match(/"url":"(.*?)"/)[1]
        .match(/(.*)/)[0]
        .replace("https://9anime.pl/watch/", "") || "";
  }
  if (json.data.Sites.animepahe) {
    idPahe =
      JSON.stringify(json.data.Sites.animepahe)
        .match(/"identifier":"(.*?)"/)[1]
        .match(/(.*)/)[0] || "";
  }

  return {
    idGogo,
    idZoro,
    id9anime,
    idPahe,
  };
};

const AnimeInfo = async (id) => {
  const query = InfoQuery(id);
  try {
    const { data } = await FetchAnilist.post("", {
      query,
    });
    const masdata = await FetchMalSyncData(data.data.Media.idMal);
    let isDub = false;
    if (masdata.data.Sites.Gogoanime) {
      if (JSON.stringify(masdata.data.Sites.Gogoanime).includes("dub")) {
        isDub = true;
      }
    }
    const idprovider = await getIDeachProvider(masdata);
    const res = {
      id: data.data.Media.id,
      idMal: data.data.Media.idMal,
      id_provider: idprovider,
      title: data.data.Media.title,
      dub: isDub,
      description: data.data.Media.description,
      coverImage: data.data.Media.coverImage,
      bannerImage: data.data.Media.bannerImage,
      genres: data.data.Media.genres,
      status: data.data.Media.status,
      format: data.data.Media.format,
      episodes: data.data.Media.episodes,
      year: data.data.Media.seasonYear,
      season: data.data.Media.season,
      duration: data.data.Media.duration,
      startIn: data.data.Media.startDate,
      endIn: data.data.Media.endDate,
      nextair: data.data.Media.nextAiringEpisode,
      score: {
        averageScore: data.data.Media.averageScore,
        decimalScore: data.data.Media.averageScore / 10,
      },
      popularity: data.data.Media.popularity,
      siteUrl: data.data.Media.siteUrl,
      trailer: data.data.Media.trailer,
      studios: data.data.Media.studios.nodes,
    };
    return res;
  } catch (err) {
    if (err.response) {
      return {
        code: err.response.status,
        message: err.message,
      };
    }
    throw err;
  }
};

const AnimeSearch = async (query, page, limit) => {
  const querys = SearchQ();
  try {
    const data = await FetchAnilist.post("", {
      query: querys,
      variables: {
        search: query,
        page: page,
        size: limit,
        type: "ANIME",
      },
    });
    const res = {
      pageInfo: data.data.data.Page.pageInfo,
      data: data.data.data.Page.media,
    };
    return res;
  } catch (err) {
    if (err.response) {
      return {
        code: err.response.status,
        message: err.message,
      };
    }
    throw err;
  }
};

const AnimeAdvancedSearch = async (req_data) => {
  const querys = SearchQ();
  try {
    const data = await FetchAnilist.post("", {
      query: querys,
      variables: req_data,
    });
    console.log({
      variables: {
        req_data,
      },
    });
    const res = {
      pageInfo: data.data.data.Page.pageInfo,
      data: data.data.data.Page.media,
    };
    return res;
  } catch (err) {
    if (err.response) {
      return {
        code: err.response.status,
        message: err.message,
      };
    }
    throw err;
  }
};

const AnimeRecommendations = async (id) => {
  const query = RecommendationsQuery(id);
  try {
    const Recndtdata = await FetchAnilist.post("", {
      query,
    });
    const data = Recndtdata.data.data.Media;
    const results = [];
    for (const anime of data.recommendations.nodes) {
      results.push({
        id: anime.mediaRecommendation.id,
        idMal: anime.mediaRecommendation.idMal,
        title: anime.mediaRecommendation.title,
        coverImage: anime.mediaRecommendation.coverImage,
        bannerImage: anime.mediaRecommendation.bannerImage,
        type: anime.mediaRecommendation.type,
        format: anime.mediaRecommendation.format,
        status: anime.mediaRecommendation.status,
        episodes: anime.mediaRecommendation.episodes,
        duration: anime.mediaRecommendation.duration,
        score: {
          averageScore: anime.mediaRecommendation.averageScore,
          decimalScore: anime.mediaRecommendation.averageScore / 10,
        },
      });
    }
    return results;
  } catch (err) {
    if (err.response) {
      return {
        code: err.response.status,
        message: err.message,
      };
    }
    throw err;
  }
};

const AnimeAiringSchedule = async ({
  page,
  perPage,
  weekStart,
  weekEnd,
  notYetAired,
}) => {
  const query = airingScheduleQuery({
    page,
    perPage,
    weekStart,
    weekEnd,
    notYetAired,
  });
  try {
    const { data } = await FetchAnilist.post("", {
      query,
    });
    const res = {
      pageInfo: data.data.Page.pageInfo,
      data: data.data.Page.airingSchedules,
    };
    return res;
  } catch (err) {
    if (err.response) {
      return {
        code: err.response.status,
        message: err.message,
      };
    }
    throw err;
  }
};

const AniSkipData = async (id, ep_id) => {
  try {
    const url = "https://api.aniskip.com/v2";
    const ani_id = await AnimeInfo(id);
    const { data } = await axios.get(
      `${url}/skip-times/${ani_id.idMal}/${ep_id}?types[]=ed&types[]=mixed-ed&types[]=mixed-op&types[]=op&types[]=recap&episodeLength=`
    );
    return data;
  } catch (err) {
    if (err.response) {
      return {
        code: err.response.status,
        message: err.message,
      };
    }
    throw err;
  }
};

export default {
  AnimeInfo,
  AnimeSearch,
  AnimeRecommendations,
  AnimeAdvancedSearch,
  AnimeAiringSchedule,
  AniSkipData,
};