package 에 아래 코드를 추가하면 위젯 메니페스트로 생성된다
어떻게 처리되야하는지 예제코드를 좀 봐야함

pipe와 호환되게해주는 iterGenarator 를 많이 쓴다

```
"containsWidget": true
```

타입 별로 모듈화 하자
핵심 로직은 전체 순회를 해서, 필요한 데이터를 수집해서 result에 저장하는 것

"codegenLanguages": [
{
"label": "Everything",
"value": "all"
},
{
"label": "HTML",
"value": "html"
},
{
"label": "CSS",
"value": "css"
},
{
"label": "JS",
"value": "js"
},
{
"label": "JSON",
"value": "json"
},
{
"label": "Weather 🌦",
"value": "weather"
}
],
"codegenPreferences": [
{
"itemType": "unit",
"scaledUnit": "Sample Unit (su)",
"defaultScaleFactor": 0.7,
"default": false
},
{
"itemType": "select",
"propertyName": "example",
"label": "Yes or no",
"options": [
{
"label": "Yes",
"value": "yes",
"isDefault": true
},
{
"label": "No",
"value": "no"
}
]
},
{
"itemType": "action",
"propertyName": "example",
"label": "Example action"
}
],
"menu": [
{
"name": "CodeGen",
"main": "src/CodeGen/main.ts",
"ui": "src/CodeGen/ui.tsx"
},
{
"name": "Figma To Code",
"main": "src/layerExport/main.ts",
"ui": "src/layerExport/ui.tsx"
},
{
"name": "SVG Asset Export",
"main": "src/svgAssetExport/main.ts",
"ui": "src/svgAssetExport/ui.tsx"
}
]
