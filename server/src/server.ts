import express from "express";
import cors from "cors";

import { PrismaClient } from "@prisma/client";
import { convertHourStringToMinutes } from "./utils/convert-hour-string-to-minutes";
import { convertMinutesToHour } from "./utils/convert-minutes-to-hours";

const app = express();
app.use(express.json());
app.use(cors());

const prisma = new PrismaClient({});

// SHORT CUT CONTROL + D

app.get("/games/:id/ads", async (req, resp) => {
  const gameId = req.params.id;

  const ads = await prisma.ad.findMany({
    select: {
      id: true,
      name: true,
      weekDays: true,
      useVoiceChannel: true,
      yearsPlaying: true,
      hourStart: true,
      hourEnd: true,
    },
    where: {
      gameId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const formatedAds = ads.map((ad) => {
    return {
      ...ad,
      weekDays: ad.weekDays.split(","),
      hourStart: convertMinutesToHour(ad.hourStart),
      hourEnd: convertMinutesToHour(ad.hourEnd),
    };
  });

  return resp.json(formatedAds);
});

app.get("/ads/:id/discord", async (req, resp) => {
  const adId = req.params.id;

  const ad = await prisma.ad.findUniqueOrThrow({
    select: {
      discord: true,
    },
    where: {
      id: adId,
    },
  });
  return resp.json({
    discord: ad.discord,
  });
});

app.post("/games/:id/ads", async (req, resp) => {
  const gameId = req.params.id;

  const body: any = req.body;

  const ad = await prisma.ad.create({
    data: {
      gameId,
      name: body.name,
      yearsPlaying: body.yearsPlaying,
      discord: body.discord,
      weekDays: body.weekDays.join(","),
      hourStart: convertHourStringToMinutes(body.hourStart),
      hourEnd: convertHourStringToMinutes(body.hourEnd),
      useVoiceChannel: body.useVoiceChannel,
    },
  });

  return resp.status(201).json(ad);
});

app.get("/games", async (req, resp) => {
  const games = await prisma.game.findMany({
    include: {
      _count: {
        select: {
          ads: true,
        },
      },
    },
  });
  return resp.json(games);
});

/* npx tsc --init 
npm run build
npm install @types/express -D 
npm i ts-node-dev -D // restart aut da app
*/

app.listen(3333);
