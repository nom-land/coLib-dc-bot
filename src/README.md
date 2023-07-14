Scenario:
Alice curates the article "why should we decentralize curation?" with the note:
“This article has a great insight.”
"decentralization/creator economy"

The metadata of the note she posted may be like:

```json
{
  content: "This article has a great insight."
  labeling_tags: "decentralization/creator economy" // 放在attachment里还是attributes里？
  attributes: [
    {
    "trait_type": "community",
    "value": "DDAO",
    "display_type": "string"
    },
    {
    "trait_type": "curating note",
    "value": "csb://xxx/xxx", //char id; note id
    "display_type": "string"
    }
  ],
  sources: ["nunki"]
  date_published: "xxx"
}
```
This note has a link to the note: 
```json
{
  title: "why should we decentralize curation?"
  attributes: [
    author: "xxx"
  ] //一些metadata，包括 ipfs 地址
}
```


Data Structure
```js
{
  curating_reason: {
    // labeling_title: "", // Nomland doesn't need it
    comment: "This article has a great insight."
    labeling_tags: "decentralization/creator economy" // Is there any better wording?
  },
  community: "DDAO",
  list: "all about curation",
  variant: "" //TODO: use what name to distinguish? use variant or attributes?
  // 如果是 curation 角度协议来讲，是 variant: "curation"
  // 如果是从区分这是否是评论角度来看
  appId: "nunki"
}
```

---

crossbell - curate
      |
      |
      ----- utils
discord --- utils
discord --- curate

curate - utils
discord - utils
discord - curate


Curation 模块的消息的输入是
```js
{
  curator: {
    id: ...
  },
  record: {

  },
  reason: {
    // labeling_title: "", // Nomland doesn't need it
    comment: "This article has a great insight."
    labeling_tags: "decentralization/creator economy" // Is there any better wording?
  },
  community: "DDAO",
  list: "all about curation",
} as Curation
```
