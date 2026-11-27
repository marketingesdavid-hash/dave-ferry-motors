"""Produce REVIEW candidates; preserve hoodie head, hands and denim.
Do not publish without visual inspection. Donor cloth/arms are registered
to the original hoodie pose; hidden skin is inferred from old T-shirt photos."""
from pathlib import Path
import base64,io,json
import numpy as np
from PIL import Image,ImageDraw
from scipy.ndimage import map_coordinates,gaussian_filter
root=Path(__file__).resolve().parents[1]
src=json.loads((root/'assets/models-v4.js').read_text().split('Object.freeze(',1)[1].rsplit(')',1)[0])
out=root/'assets/models-v41-identity';out.mkdir(exist_ok=True)
qa=root/'qa-v41-identity';qa.mkdir(exist_ok=True)
W,H=596,653
yy,xx=np.mgrid[:H,:W]
colors=('black','white','gray','khaki','burgundy')
def load(m,g,c):
 k=m+'-'+g+'-'+c
 for folder in ('models-v41-light','models-v32'):
  p=root/'assets'/folder/(k+'.webp')
  if p.exists():return np.array(Image.open(p).convert('RGB'),dtype=np.float32)
 return np.array(Image.open(io.BytesIO(base64.b64decode(src[k].split(',',1)[1]))).convert('RGB'),dtype=np.float32)
def poly(p):
 im=Image.new('L',(W,H));ImageDraw.Draw(im).polygon(p,fill=255)
 return np.array(im,dtype=np.float32)/255
# Donor and reference y landmarks: collar, shoulder, sleeve edge, elbow, wrist, hem.
# Each row traces outer arm / inner arm / inner arm / outer arm.  Upper-arm
# skin follows the original hoodie silhouette with a narrower short-sleeve fit.
data={
 'jack':{
 'sy':[0,197,225,250,300,350,400,450,500,550,577,652],
 'ty':[0,199,230,260,312,356,400,445,480,515,606,652],
 's':[[230,248,339,355],[244,252,338,350],[194,215,380,405],[155,190,405,435],[138,184,402,450],[131,186,403,456],[115,187,408,467],[112,185,413,469],[117,187,414,471],[120,180,405,470],[122,176,410,471],[123,174,409,460]],
 't':[[242,248,344,355],[238,251,345,359],[190,215,382,409],[144,190,406,452],[119,180,416,476],[110,174,423,486],[104,173,424,493],[112,177,422,485],[129,189,415,468],[157,211,392,444],[180,224,370,422],[182,225,370,421]],
 'head':[(0,0),(595,0),(595,170),(357,170),(346,182),(345,200),(338,211),(318,221),(299,228),(279,218),(262,207),(252,193),(252,177),(238,170),(0,170)],
 'hands': [[(0,517),(117,514),(130,508),(144,500),(158,504),(171,527),(184,549),(206,563),(230,577),(253,596),(255,620),(595,620),(595,652),(0,652)],[(595,518),(475,515),(464,506),(448,502),(437,514),(428,538),(413,558),(391,569),(365,580),(344,597),(340,620),(595,620)]],
 'bottom':604},
 'sophie':{
 'sy':[0,203,231,256,299,345,390,440,478,510,523,652],
 'ty':[0,191,230,256,306,354,404,480,528,558,568,652],
 's':[[230,245,346,363],[252,262,343,352],[198,224,372,403],[169,209,389,425],[164,204,391,432],[151,213,384,441],[145,225,372,445],[147,219,382,434],[162,200,395,414],[181,214,380,414],[184,220,376,416],[181,225,377,430]],
 't':[[238,252,344,356],[254,263,346,356],[201,229,374,407],[166,207,399,437],[150,202,401,450],[143,202,400,456],[139,204,397,462],[143,205,396,457],[155,207,392,443],[174,221,379,424],[188,231,366,411],[183,225,380,427]],
 'head':[(0,0),(595,0),(595,171),(355,171),(345,189),(343,202),(332,214),(305,229),(281,220),(264,208),(259,192),(252,176),(236,171),(0,171)],
 'hands':[[(0,529),(158,526),(168,517),(180,519),(191,531),(205,544),(226,555),(248,570),(257,590),(595,590),(595,652),(0,652)],[(595,527),(445,522),(434,514),(423,522),(411,537),(390,550),(369,561),(354,578),(350,590),(595,590)]],
 'bottom':566},
 'george':{
 'sy':[0,207,232,260,320,374,425,480,530,576,627,652],
 'ty':[0,195,229,260,320,377,430,480,529,572,623,652],
 's':[[215,245,350,380],[238,250,345,366],[184,215,382,427],[135,175,431,468],[98,164,437,496],[85,157,440,510],[78,160,441,518],[87,162,439,512],[104,167,430,497],[125,182,415,477],[154,198,397,446],[152,200,396,446]],
 't':[[213,245,350,393],[231,250,352,380],[182,214,386,425],[139,178,430,471],[114,165,440,493],[91,157,446,511],[86,160,446,515],[96,166,440,505],[117,185,425,486],[146,209,401,459],[171,224,380,432],[171,224,380,432]],
 'head':[(0,0),(595,0),(595,173),(402,173),(394,188),(382,202),(367,205),(350,197),(341,209),(322,222),(301,228),(280,220),(258,205),(245,194),(226,206),(209,199),(197,183),(0,173)],
 'hands':[[(0,540),(105,540),(118,523),(137,514),(153,516),(166,536),(184,557),(208,573),(237,585),(266,610),(269,630),(595,630),(595,652),(0,652)],[(595,540),(487,539),(475,520),(458,514),(443,519),(428,542),(410,564),(388,579),(364,589),(344,610),(340,630),(595,630)]],
 'bottom':609},
 'emma':{
 'sy':[0,194,228,252,309,357,404,449,482,513,533,652],
 'ty':[0,193,232,260,320,371,421,491,535,570,586,652],
 's':[[230,249,354,370],[250,262,350,365],[188,217,390,430],[157,191,415,452],[135,188,419,469],[115,187,417,483],[111,181,421,486],[128,178,422,469],[141,174,424,450],[166,202,396,428],[168,212,389,434],[164,210,391,438]],
 't':[[229,249,351,375],[250,262,350,365],[190,215,389,430],[155,192,420,461],[130,185,426,477],[116,182,429,490],[111,183,428,496],[125,188,423,485],[144,194,417,465],[167,213,397,442],[184,229,377,421],[179,225,377,431]],
 'head':[(0,0),(595,0),(595,168),(363,168),(353,186),(349,201),(335,216),(305,232),(280,220),(263,206),(257,191),(249,176),(230,168),(0,168)],
 'hands':[[(0,521),(135,518),(149,509),(163,511),(177,527),(192,543),(216,557),(242,572),(260,589),(264,620),(595,620),(595,652),(0,652)],[(595,520),(464,520),(451,509),(437,516),(425,533),(407,551),(384,565),(359,581),(343,602),(340,620),(595,620)]],
 'bottom':582}
}
def warp(im,d):
 sy=np.interp(np.arange(H),d['ty'],d['sy'])
 s=np.column_stack([np.interp(np.arange(H),d['ty'],np.array(d['s'])[:,i]) for i in range(4)])
 t=np.column_stack([np.interp(np.arange(H),d['ty'],np.array(d['t'])[:,i]) for i in range(4)])
 mx=np.zeros((H,W),dtype=np.float32)
 for y in range(H):
  a=[0,t[y,0],t[y,1],298,t[y,2],t[y,3],595];b=[0,s[y,0],s[y,1],298,s[y,2],s[y,3],595]
  mx[y]=np.interp(np.arange(W),a,b)
 return np.stack([map_coordinates(im[:,:,i],[np.broadcast_to(sy[:,None],(H,W)),mx],order=1,mode='nearest') for i in range(3)],axis=2)
for m,d in data.items():
 ref=load(m,'hoodie','black')
 # Exact head, hair and visible lower body source pixels.  Outside the
 # neckline the T-shirt donor provides cloth, not an overlapping hoodie.
 # Preserve the actual hoodie face and neck only; never carry black hood
 # fabric into the new shirt.  Hair and ear contours are protected explicitly.
 head=poly(d['head'])
 luma=ref@np.array([.2126,.7152,.0722],dtype=np.float32)
 skin=(ref[:,:,0]-ref[:,:,2]>16)&(ref[:,:,0]-ref[:,:,1]>4)&(luma>44)
 beard=(xx>250)&(xx<349)&(yy<193)&(yy>=160)&(luma>35)
 if m=='george':
  hair=poly([(195,150),(233,151),(252,169),(247,187),(232,194),(215,194),(205,187)])+poly([(344,150),(394,150),(399,176),(390,192),(369,196),(350,185)])
  hair=(hair>.5)&((ref[:,:,0]-ref[:,:,2]>3)|(luma>48))
  head*=((yy<171)|skin|beard|hair)
 else:
  earrings=((xx>233)&(xx<264)|(xx>345)&(xx<376))&(yy<178)&(luma>40)
  head*=((yy<166)|skin|beard|earrings)
 head[yy<165]=1
 # Cuff-to-hand boundaries traced on each original hoodie.  This preserves
 # exactly one set of hands and wrist accessories and excludes hoodie sleeves.
 wrist={
 'jack': [[(115,522),(127,513),(145,505),(161,501),(168,519),(178,545),(183,557),(194,563),(218,576),(242,595),(251,608),(246,617),(216,621),(171,619),(146,597),(137,575),(126,552)],[(431,507),(452,502),(474,505),(480,517),(472,539),(462,557),(453,576),(440,594),(428,612),(400,620),(362,618),(346,610),(345,601),(364,587),(390,574),(416,558),(420,536)]],
 'sophie': [[(166,535),(176,522),(187,517),(194,519),(205,531),(222,545),(242,560),(257,570),(253,579),(238,579),(221,582),(198,580),(182,566),(170,551)],[(418,520),(429,511),(441,513),(452,528),(452,541),(439,556),(425,572),(401,581),(377,580),(355,574),(355,568),(376,551),(394,536),(408,529)]],
 'george': [[(111,537),(120,523),(137,516),(156,514),(165,531),(175,550),(193,566),(216,581),(241,596),(246,607),(238,616),(212,621),(174,620),(149,609),(137,590),(125,563)],[(442,515),(457,512),(476,518),(489,529),(483,547),(475,562),(467,580),(455,598),(435,616),(410,621),(377,619),(365,610),(369,603),(392,584),(418,565),(433,545)]],
 'emma': [[(130,509),(141,497),(158,491),(171,492),(177,508),(185,524),(201,534),(223,550),(235,565),(230,576),(215,582),(191,584),(169,580),(151,566),(142,547),(135,529)],[(442,498),(454,494),(470,498),(478,507),(472,523),(465,542),(458,559),(443,575),(421,584),(398,583),(382,574),(381,567),(395,552),(416,535),(432,521)]]
 }[m]
 hands=np.maximum.reduce([poly(p) for p in wrist])
 # Below the original waistband the reference is unchanged. The T-shirt
 # donor's cloth is extended to the same natural hem, hiding its own jeans.
 hem={'jack':606,'sophie':567,'george':622,'emma':587}[m]
 d['bottom']=hem
 protect=np.maximum(head,hands)
 protect[yy>=hem]=1
 # Remove duplicate donor accessories and hands above the reference cuff:
 # horizontally align the donor lower arms to the reference wrist coordinates;
 # preserve outside background as well as exposed reference skin below cuff.
 side={'jack':(510,186,414),'sophie':(522,199,408),'george':(523,183,432),'emma':(501,188,430)}[m]
 cutoff,left,right=side
 # At the outer sides below the cuffs, use reference pixels only where
 # they are background or belong to the traced actual hand/forearm.
 white=(ref.min(axis=2)>220)
 protect=np.maximum(protect,((yy>=cutoff)&((xx<left)|(xx>right))&white).astype('float32'))
 protect=np.clip(gaussian_filter(protect,.85),0,1)
 protect[yy<165]=1
 protect[yy>=hem+3]=1
 hoodie_protect=np.maximum(head,(yy>=hem).astype('float32'))
 hoodie_protect=np.clip(gaussian_filter(hoodie_protect,.65),0,1)
 hoodie_protect[yy<165]=1
 hoodie_protect[yy>=hem+3]=1
 sheet=Image.new('RGB',(1250,620),'#efefed');draw=ImageDraw.Draw(sheet);draw.text((10,5),m.upper()+' / identity candidates — review only',fill='#222')
 for row,g in enumerate(('tshirt','hoodie')):
  for col,c in enumerate(colors):
   if g=='tshirt':
    donor=warp(load(m,'tshirt',c),d)
    im=donor*(1-protect[...,None])+ref*protect[...,None]
   else:
    donor=load(m,'hoodie',c)
    im=donor*(1-hoodie_protect[...,None])+ref*hoodie_protect[...,None]
   im=np.rint(im).clip(0,255).astype('uint8')
   assert np.array_equal(im[:165],ref[:165].astype('uint8'))
   assert np.array_equal(im[d['bottom']+3:],ref[d['bottom']+3:].astype('uint8'))
   p=out/(m+'-'+g+'-'+c+'.webp');Image.fromarray(im).save(p,lossless=True,method=4)
   thumb=Image.fromarray(im);thumb.thumbnail((238,260));x=col*250;y=22+row*299;sheet.paste(thumb,(x+(250-thumb.width)//2,y+22));draw.text((x+7,y+3),g+' / '+c,fill='#222')
 sheet.save(qa/(m+'-variants.jpg'),quality=92)
print('40 review images; exact source head and lower denim verified; visual approval required')
