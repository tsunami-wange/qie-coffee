"""Read XLSX via standard-library XML. Only whitelisted consumer fields are exported."""
import argparse,json,re,zipfile,xml.etree.ElementTree as ET,hashlib
from pathlib import Path
N={'m':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
ROOT=Path(__file__).resolve().parents[1]
def read(path):
 z=zipfile.ZipFile(path); ss=[]
 if 'xl/sharedStrings.xml' in z.namelist(): ss=[''.join(e.itertext()) for e in ET.fromstring(z.read('xl/sharedStrings.xml')).findall('m:si',N)]
 out=[]
 for name in sorted([n for n in z.namelist() if re.match(r'xl/worksheets/sheet\d+\.xml$',n)],key=lambda n:int(re.search(r'sheet(\d+)',n)[1])):
  root=ET.fromstring(z.read(name)); cells={}
  for c in root.findall('.//m:sheetData/m:row/m:c',N):
   v=c.find('m:v',N); inline=c.find('m:is',N); value=(v.text or '') if v is not None else ''.join(inline.itertext()) if inline is not None else ''
   cells[c.attrib['r']]=ss[int(value)] if c.get('t')=='s' and value else value
  # Fill vertical category merges only; horizontal title merges remain titles.
  for m in root.findall('.//m:mergeCell',N):
   a,b=m.attrib['ref'].split(':'); ca,ra=re.match(r'([A-Z]+)(\d+)',a).groups();cb,rb=re.match(r'([A-Z]+)(\d+)',b).groups()
   if ca==cb:
    for r in range(int(ra),int(rb)+1): cells[f'{ca}{r}']=cells.get(a,'')
  rows=[]
  for r in range(1,max(int(re.search(r'\d+',k)[0]) for k in cells)+1): rows.append({re.sub(r'\d','',k):v for k,v in cells.items() if int(re.search(r'\d+',k)[0])==r})
  out.append(rows)
 return out
def dump(path,x):path.parent.mkdir(parents=True,exist_ok=True);path.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
def main():
 ap=argparse.ArgumentParser();ap.add_argument('summary');ap.add_argument('full');a=ap.parse_args();summary=read(a.summary);full=read(a.full)
 translations=json.loads((ROOT/'scripts/translations.json').read_text()); trans=lambda v:translations.get(v,v)
 catalog=[]; main=''; sub=''
 for r in summary[0]:
  if r.get('A','').startswith('Qie.') and '全部' not in r['A']: main=r['A'].split()[0]
  elif r.get('A')=='共享配套产品':main='Shared'
  if r.get('B')=='产品名称':sub=r['A']
  elif r.get('B') and r.get('D'):
   catalog.append(dict(name=r['B'],ingredients=r['C'],price=float(r['D']),notes=r.get('E',''),main=main,sub=sub))
 diffs=[]; products=[]; options=[]
 if summary[0]!=full[0]:
  for i,(l,r) in enumerate(zip(summary[0],full[0]),1):
   if l!=r:diffs.append({'row':i,'summary':l,'full':r})
 for item in catalog:
  diy=item['sub'].startswith('DIY'); matches=[r for r in full[3 if diy else 1][1:] if r.get('C' if diy else 'D')==item['name']]
  if len(matches)!=1:raise ValueError('Non-unique match: '+item['name'])
  r=matches[0];price=float(r['D' if diy else 'H']);id=r['A']
  if price!=item['price']:diffs.append({'id':id,'field':'price','summary':item['price'],'full':price})
  ingredients=item['ingredients'];allergens=[]
  for words,label in [(['牛奶','淡奶油','奶皮子','酸奶','酥油','黄油','奶油'],'milk'),(['芝麻'],'sesame'),(['豆乳','腐乳'],'soy')]:
   if any(w in ingredients for w in words):allergens.append(label)
  obj={'id':id,'name':{'zh':item['name'],'en':r.get('E') if not diy else trans(item['name'])},'main':item['main'],'sub':item['sub'],'ingredients':{'zh':ingredients,'en':trans(ingredients)},'price':item['price'],'allergens':allergens,'alcohol':'酒酿' in ingredients,'notes':{'zh':re.sub(r'；固定预算组合；替换须更新BOM','',item['notes']),'en':trans(item['notes'])}}
  if diy:
   obj.update(group=id[0]);options.append(obj)
  else:
   obj.update(status='available' if r['F']=='首期' else 'rotation' if r['F']=='轮换' else 'concept',seasonal='节令' in r['F'],spec={'zh':r['G'],'en':trans(r['G'])},image=f'images/{id}.svg',tags=[item['main'].replace('Qie.','')]+(['seasonal'] if '节令' in r['F'] else []),description={'zh':f"以{ingredients}呈现{item['name']}的风味构想。",'en':f"{r['E']}, composed with {trans(ingredients)}."},temperature=['iced'] if re.search('冷萃|气泡',item['name']) else ['hot','iced'] if item['main']=='Qie.Classic' or item['sub']=='非咖啡饮品' else [],sweetness=['standard','less'] if '白砂糖' in ingredients else [])
   products.append(obj)
 counts={s:sum(x['sub']==s for x in catalog) for s in dict.fromkeys(x['sub'] for x in catalog)}
 report={'sources':[Path(a.summary).name,Path(a.full).name],'fileNote':'需求中的完整菜单与配料预算文件名未找到；实际附加菜单及报价表包含完整菜单及预算。','fixed':len(products),'diy':len(options),'subseries':len(counts),'counts':counts,'differences':diffs,'policy':'分类与主要配料取分类汇总；SKU/英文名/规格/上线建议取完整表。冲突时停止导入；备注原文保留但经营措辞不展示。BOM克数、成本和采购数据不导出。英文为编辑翻译；过敏原仅按明确原料识别，成品需供应商确认。'}
 dump(ROOT/'outputs/data-audit.json',report)
 if diffs:raise ValueError('Source conflicts: see outputs/data-audit.json; no product data overwritten')
 assert len(products)==63 and len(options)==30 and len(counts)==14
 dump(ROOT/'src/data/products.json',products);dump(ROOT/'src/data/diy-options.json',options)
 print(json.dumps({'fixed':len(products),'diy':len(options),'subseries':len(counts),'conflicts':len(diffs)}))
if __name__=='__main__':main()
