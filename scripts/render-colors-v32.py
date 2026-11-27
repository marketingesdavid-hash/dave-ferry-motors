"""Generate fixed, individually masked preview photos from the current registered model images."""
import base64, io, json
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy.ndimage import gaussian_filter, binary_fill_holes, label
root=Path(__file__).resolve().parents[1]
src=(root/'assets/models-v4.js').read_text()
models=json.loads(src.split('Object.freeze(',1)[1].rsplit(')',1)[0])
out=root/'assets/models-v32'; out.mkdir(parents=True,exist_ok=True)
qa=root/'qa-colors-v32'; qa.mkdir(exist_ok=True)
W,H=596,653
# Silhouette boundaries based on the eight original black photographs.
outlines={
 'jack-tshirt':[(130,348),(138,284),(158,250),(185,229),(249,197),(259,209),(279,222),(302,226),(325,222),(338,198),(380,214),(415,232),(439,261),(448,296),(457,348),(404,371),(399,414),(403,526),(408,572),(378,582),(225,582),(177,576),(185,526),(190,439),(184,370)],
 'sophie-tshirt':[(165,289),(166,252),(182,228),(209,217),(241,211),(260,204),(267,216),(285,227),(307,230),(331,221),(342,204),(370,211),(405,220),(425,239),(432,275),(432,299),(397,316),(385,317),(380,361),(368,400),(379,446),(392,479),(367,507),(349,521),(247,522),(209,508),(196,480),(210,438),(225,400),(219,362),(207,317)],
 'george-tshirt':[(84,369),(97,322),(111,285),(142,253),(174,233),(223,213),(248,201),(254,216),(282,230),(311,231),(333,225),(345,202),(376,209),(431,230),(471,261),(492,312),(510,374),(464,399),(431,402),(430,456),(437,512),(424,548),(397,577),(377,609),(349,626),(239,627),(207,613),(175,585),(162,552),(159,507),(164,445),(162,405),(126,399)],
 'emma-tshirt':[(133,302),(145,263),(163,236),(192,218),(222,209),(261,195),(269,211),(288,225),(307,230),(332,222),(347,207),(350,195),(385,206),(431,221),(451,244),(466,281),(469,313),(429,340),(416,341),(406,386),(410,428),(425,467),(390,497),(375,522),(347,531),(255,532),(225,521),(201,493),(167,480),(180,443),(185,400),(188,341),(168,337)],
 'jack-hoodie':[(114,527),(96,485),(82,443),(96,397),(103,350),(123,290),(151,257),(181,233),(205,216),(213,190),(229,181),(252,180),(258,199),(277,217),(300,230),(326,214),(343,194),(349,181),(369,184),(386,198),(394,215),(431,239),(462,272),(482,331),(490,373),(510,428),(516,459),(495,503),(479,522),(443,501),(431,531),(420,557),(388,563),(354,593),(240,594),(211,567),(176,565),(165,504),(142,502)],
 'sophie-hoodie':[(165,533),(142,496),(130,452),(126,411),(139,378),(146,322),(153,281),(167,246),(186,228),(214,218),(219,194),(232,184),(258,183),(264,201),(284,220),(304,231),(330,217),(344,195),(344,182),(370,185),(380,199),(386,216),(415,224),(435,247),(446,280),(456,331),(460,371),(472,412),(473,449),(463,491),(443,522),(412,520),(405,537),(379,540),(358,557),(247,557),(221,537),(193,521),(176,537)],
 'george-hoodie':[(103,540),(82,503),(69,453),(82,402),(100,350),(111,307),(133,264),(170,236),(201,218),(200,190),(216,182),(231,194),(249,197),(260,215),(284,222),(304,229),(329,216),(349,204),(370,190),(390,181),(399,203),(402,217),(439,235),(469,264),(492,315),(512,375),(528,411),(535,452),(523,497),(490,532),(451,516),(430,541),(420,567),(396,566),(368,606),(241,606),(211,579),(174,559),(159,516),(141,519),(116,540)],
 'emma-hoodie':[(137,521),(115,478),(101,433),(106,396),(116,347),(131,295),(148,261),(169,238),(199,221),(211,214),(220,190),(238,179),(258,179),(265,195),(286,220),(305,233),(330,218),(347,197),(350,176),(375,182),(391,194),(399,216),(431,226),(457,253),(476,294),(490,345),(497,378),(506,422),(506,455),(489,496),(477,511),(442,507),(433,534),(414,542),(378,577),(246,582),(216,549),(179,532),(160,501),(145,521)]
}
# Collar region: hand-calibrated neck opening is excluded, cloth and hood lining included.
collars={
 'jack-tshirt':[(210,226),(249,197),(259,209),(279,222),(302,226),(325,222),(338,198),(380,214),(394,245),(205,247)],
 'sophie-tshirt':[(221,216),(260,204),(267,216),(285,227),(307,230),(331,221),(342,204),(378,214),(392,246),(210,247)],
 'george-tshirt':[(215,218),(248,201),(254,216),(282,230),(311,231),(333,225),(345,202),(380,213),(394,250),(207,250)],
 'emma-tshirt':[(217,211),(261,195),(269,211),(288,225),(307,230),(332,222),(347,207),(350,195),(387,208),(400,252),(205,252)],
 'jack-hoodie':[(198,216),(213,190),(229,181),(252,180),(258,199),(277,217),(300,230),(326,214),(343,194),(349,181),(369,184),(386,198),(394,215),(420,250),(184,250)],
 'sophie-hoodie':[(205,221),(219,194),(232,184),(258,183),(264,201),(284,220),(304,231),(330,217),(344,195),(344,182),(370,185),(380,199),(386,216),(410,249),(195,249)],
 'george-hoodie':[(185,231),(200,190),(216,182),(231,194),(249,197),(260,215),(284,222),(304,229),(329,216),(349,204),(370,190),(390,181),(399,203),(402,217),(425,248),(185,248)],
 'emma-hoodie':[(199,221),(211,214),(220,190),(238,179),(258,179),(265,195),(286,220),(305,233),(330,218),(347,197),(350,176),(375,182),(391,194),(399,216),(421,250),(188,250)]
}
def source(key):
 return np.asarray(Image.open(io.BytesIO(base64.b64decode(models[key].split(',',1)[1]))).convert('RGB'),dtype=np.float32)
def poly(points):
 im=Image.new('L',(W,H));ImageDraw.Draw(im).polygon(points,fill=255)
 return np.asarray(im,dtype=np.float32)/255
def smooth(a,b,x):
 t=np.clip((x-a)/(b-a),0,1);return t*t*(3-2*t)
def luminance(x):return x@np.array([.2126,.7152,.0722],dtype=np.float32)
colors={'khaki':(98,107,70),'burgundy':(114,47,55)}
sheets={k:[] for k in colors}
for key,points in outlines.items():
 black,gray,white=[source(key+'-'+c) for c in ('black','gray','white')]
 base=black.copy()
 if key=='george-hoodie':
  # Same face/pose: use the intact grey beard from the registered image.
  y,x=np.ogrid[:H,:W];q=np.sqrt(((x-299)/61)**2+((y-169)/38)**2)
  blend=(1-smooth(.68,1,q))[...,None];base=base*(1-blend)+gray*blend
 l,gl,wl=map(luminance,(black,gray,white))
 chroma=black.max(axis=2)-black.min(axis=2)
 allowed=poly(points)
 collar=poly(collars[key])
 # Reference variants identify cloth; actual dark neutral collar pixels fill gaps
 # where previous recolours omitted fabric. No rectangular exclusion.
 evidence=smooth(7,42,gl-l)*smooth(18,85,wl-l)
 neutral=(1-smooth(18,48,chroma))*(1-smooth(75,145,l))
 core=np.maximum(evidence,collar*.99)*neutral*allowed
 # Preserve hair in George's overlapping hair/hood region unless colour evidence exists.
 if key=='george-hoodie':
  yy,xx=np.ogrid[:H,:W]
  hair=(yy<205)&((xx<249)|(xx>350))
  core[hair]*=np.maximum(evidence[hair],.2)
 # Fill small internal holes in contiguous fabric, not exposed skin.
 connected,n=label(core>.12)
 ids=np.unique(connected[280:350,260:340]);ids=ids[ids!=0]
 keep=np.isin(connected,ids)
 fill=binary_fill_holes(keep)&(neutral>.75)&(allowed>.5)
 alpha=np.maximum(core*keep,fill*.94)*allowed
 alpha=np.maximum(alpha,collar*neutral*.98)
 alpha=np.clip(gaussian_filter(alpha,.55),0,1)
 alpha[alpha<.012]=0
 # Transfer fold luminance where reference cloth was recoloured; otherwise derive
 # natural collar/lining shading from the original black cloth.
 mapped=np.where(evidence>.25,gl,95+(l-24)*1.8)
 shade=np.clip(.68+.64*np.clip((mapped-104)/100+.5,0,1),.43,1.42)
 for name,rgb in colors.items():
  tinted=shade[...,None]*np.array(rgb,dtype=np.float32)
  result=np.clip(base*(1-alpha[...,None])+tinted*alpha[...,None],0,255).astype('uint8')
  im=Image.fromarray(result)
  dest=out/(key+'-'+name+'.webp');im.save(dest,format='WEBP',quality=94,method=6)
  assert dest.stat().st_size>5000 and (alpha>.5).sum()>15000,key
  sheets[name].append((key,im))
for name,items in sheets.items():
 # 4 models across, two garment rows; each full image plus neckline close-up.
 cellw,cellh=320,470
 sheet=Image.new('RGB',(4*cellw,2*cellh+42),'#f0f0ee')
 draw=ImageDraw.Draw(sheet);draw.text((18,12),name.upper()+' / 8 registered garment photos',fill='#222')
 for key,im in items:
  model,garment=key.split('-');col=['jack','sophie','george','emma'].index(model);row=['tshirt','hoodie'].index(garment)
  x=col*cellw;y=42+row*cellh
  preview=im.copy();preview.thumbnail((280,305))
  sheet.paste(preview,(x+(cellw-preview.width)//2,y+20));draw.text((x+10,y+3),key,fill='#222')
  crop=im.crop((180,165,420,265)).resize((288,120))
  sheet.paste(crop,(x+16,y+338))
 sheet.save(qa/(name+'-contact-sheet.jpg'),quality=92)
print('Generated 16 garment photos and two contact sheets')
