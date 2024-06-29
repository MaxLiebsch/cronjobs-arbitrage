import { startOfDay } from "date-fns";
import { getCrawlerDataDb, hostname, tasksCollectionName } from "../mongo.js";
import { getAmazonProductsToLookupCount } from "./getLookupProgress.js";
import { getProductsToMatchCount } from "./getMatchingProgress.js";
import {
  COOLDOWN_LONG,
  DANGLING_LOOKUP_THRESHOLD,
  DANGLING_MATCH_THRESHOLD,
} from "../../../constants.js";

export const getNewTask = async () => {
  const collectionName = tasksCollectionName;
  const db = await getCrawlerDataDb();
  const taskCollection = db.collection(collectionName);
  const today = new Date();

  const fiveMinutesAgo = new Date();
  fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);

  const oneMinuteAgo = new Date();
  oneMinuteAgo.setMinutes(oneMinuteAgo.getMinutes() - 1);

  const danglingLookupThreshold =
    process.env.TEST === "endtoend" ? 2 : DANGLING_LOOKUP_THRESHOLD;

  const danglingMatchThreshold =
    process.env.TEST === "endtoend" ? 2 : DANGLING_MATCH_THRESHOLD;

  const lowerThenStartedAt =
    process.env.TEST === "endtoend"
      ? oneMinuteAgo.toISOString()
      : fiveMinutesAgo.toISOString();

  const weekday = today.getDay();

  const start = startOfDay(today);

  let update = {};

  if (false) {
    update = {
      $set: {},
    };
  } else {
    update = {
      $push: {
        lastCrawler: hostname,
      },
      $set: {
        executing: true,
        startedAt: new Date().toISOString(),
      },
    };
  }

  const scanTaskQuery = [
    { type: "SCAN_SHOP" },
    { recurrent: { $eq: false } },
    { completed: { $eq: false } },
    { executing: { $eq: false } },
  ];

  const crawlTaskQuery = [
    { type: "CRAWL_SHOP" },
    { recurrent: { $eq: true } },
    { executing: { $eq: false } },
    { weekday: { $eq: weekday } },
    {
      $or: [{ completedAt: "" }, { completedAt: { $lt: start.toISOString() } }],
    },
  ];
  const wholesaleTaskQuery = [
    { type: "WHOLESALE_SEARCH" },
    { "progress.pending": { $gt: 0 } },
  ];

  const matchTaskQuery = [
    { type: "MATCH_PRODUCTS" },
    {
      $or: [
        { startedAt: "" },
        {
          startedAt: { $lt: lowerThenStartedAt },
        },
      ],
    },
    { recurrent: { $eq: true } },
    {
      $or: [
        {
          progress: { $exists: false },
        },
        { "progress.pending": { $gt: danglingMatchThreshold } },
      ],
    },
  ];
  const lookupTaskQuery = [
    { type: "LOOKUP_PRODUCTS" },
    {
      $or: [
        { startedAt: "" },
        {
          startedAt: { $lt: lowerThenStartedAt },
        },
      ],
    },
    { recurrent: { $eq: true } },
    {
      $or: [
        {
          progress: { $exists: false },
        },
        { "progress.pending": { $gt: danglingLookupThreshold } },
      ],
    },
  ];

  const query = {
    $and: [
      {
        maintenance: false,
      },
      {
        $or: [
          {
            $and: crawlTaskQuery,
          },
          {
            $and: scanTaskQuery,
          },
          {
            $and: wholesaleTaskQuery,
          },
          {
            $and: [
              ...matchTaskQuery,
              { cooldown: { $lt: new Date().toISOString() } },
            ],
          },
          {
            $and: [
              ...lookupTaskQuery,
              { cooldown: { $lt: new Date().toISOString() } },
            ],
          },
        ],
      },
    ],
  };
  const task = await taskCollection.findOneAndUpdate(query, update, {
    returnNewDocument: true,
  });
  console.log("Primary:task:", task?.type, " ", task?.id);

  if (task) {
    if (task.type === "CRAWL_SHOP" || task.type === "WHOLESALE_SEARCH") {
      return task;
    }
    if (task.type === "MATCH_PRODUCTS") {
      const shopProductCollectionName = task.shopDomain  ;
      const pending = await getProductsToMatchCount(shopProductCollectionName);
      if (pending === 0) {
        await updateTask(task._id, {
          executing: false,
          cooldown: new Date(Date.now() + +COOLDOWN_LONG).toISOString(),
          lastCrawler: task.lastCrawler.filter(
            (crawler) => crawler !== hostname
          ),
        });
        return null;
      } else {
        return task;
      }
    }
    if (task.type === "LOOKUP_PRODUCTS") {
      const shopProductCollectionName = task.shopDomain;
      const pending = await getAmazonProductsToLookupCount(
        shopProductCollectionName
      );
      if (pending < danglingLookupThreshold) {
        await updateTask(task._id, {
          executing: false,
          cooldown: new Date(Date.now() + COOLDOWN_LONG).toISOString(),
          lastCrawler: task.lastCrawler.filter(
            (crawler) => crawler !== hostname
          ),
        });
        return null;
      } else {
        return task;
      }
    }
  } else {
    //fallback
    const query = {
      $and: [
        {
          maintenance: false,
        },
        {
          $or: [
            {
              $and: matchTaskQuery,
            },
            {
              $and: lookupTaskQuery,
            },
          ],
        },
      ],
    };

    const task = await taskCollection.findOneAndUpdate(query, update, {
      returnNewDocument: true,
    });
    console.log("Fallback:task:", task?.type, " ", task?.id);
    if (task) {
      if (task.type === "MATCH_PRODUCTS") {
        const shopProductCollectionName = task.shopDomain  ;
        const pending = await getProductsToMatchCount(
          shopProductCollectionName
        );
        if (pending === 0) {
          await updateTask(task._id, {
            executing: false,
            cooldown: new Date(Date.now() + +COOLDOWN_LONG).toISOString(),
            lastCrawler: task.lastCrawler.filter(
              (crawler) => crawler !== hostname
            ),
          });
          return null;
        } else {
          return task;
        }
      }
      if (task.type === "LOOKUP_PRODUCTS") {
        const shopProductCollectionName = task.shopDomain;
        const pending = await getAmazonProductsToLookupCount(
          shopProductCollectionName
        );
        if (pending < danglingLookupThreshold) {
          await updateTask(task._id, {
            executing: false,
            cooldown: new Date(Date.now() + COOLDOWN_LONG).toISOString(),
            lastCrawler: task.lastCrawler.filter(
              (crawler) => crawler !== hostname
            ),
          });
          return null;
        } else {
          return task;
        }
      }
    }
    return null;
  }
};

export const findTasks = async (query) => {
  const collectionName = tasksCollectionName;
  const db = await getCrawlerDataDb();
  const collection = db.collection(collectionName);

  return collection.find(query).toArray();
};

export const findTask = async (query) => {
  const collectionName = tasksCollectionName;
  const db = await getCrawlerDataDb();
  const collection = db.collection(collectionName);

  return collection.findOne(query);
};

export const getTasks = async () => {
  const collectionName = tasksCollectionName;
  const db = await getCrawlerDataDb();
  const collection = db.collection(collectionName);
  return collection.find().toArray();
};

export const updateTask = async (id, update) => {
  const collectionName = tasksCollectionName;
  const db = await getCrawlerDataDb();
  const collection = db.collection(collectionName);
  return collection.updateOne(
    { _id: id },
    {
      $set: {
        ...update,
      },
    }
  );
};

export const updateTaskWithQuery = async (query, update) => {
  const collectionName = tasksCollectionName;
  const db = await getCrawlerDataDb();
  const collection = db.collection(collectionName);
  return collection.updateOne(
    { ...query },
    {
      $set: {
        ...update,
      },
    }
  );
};

export const updateTasks = async (taskType, update) => {
  const collectionName = tasksCollectionName;
  const db = await getCrawlerDataDb();
  const collection = db.collection(collectionName);
  return collection.updateMany(
    { type: taskType },
    {
      $set: {
        ...update,
      },
    }
  );
};

export const addTask = async (task) => {
  const collectionName = tasksCollectionName;
  const db = await getCrawlerDataDb();
  const collection = db.collection(collectionName);
  return collection.insertOne(task);
};

export const deleteTask = async (id) => {
  const collectionName = tasksCollectionName;
  const db = await getCrawlerDataDb();
  const collection = db.collection(collectionName);
  return collection.findOneAndDelete({ _id: id });
};
