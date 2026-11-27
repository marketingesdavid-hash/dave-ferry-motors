from pathlib import Path
import base64,io,json
import numpy as np
from PIL import Image,ImageDraw
from scipy.ndimage import gaussian_filter,binary_fill_holes,binary_closing,binary_dilation,median_filter,label
root=Path(__file__).resolve().parents[1]
src=json.loads((root/'assets/models-v4.js').read_text().split('Object.freeze(',1)[1].rsplit(')',1)[0])
out=root/'assets/models-v41';out.mkdir(exist_ok=True)
qa=root/'qa-v41';qa.mkdir(exist_ok=True)
def arr(im):return np.array(im.convert('RGB'),dtype=np.float32)
def load(k):return arr(Image.open(io.BytesIO(base64.b64decode(src[k].split(',',1)[1]))))
def smooth(a,b,x):
 t=np.clip((x-a)/(b-a),0,1);return t*t*(3-2*t)
for m in ('jack','sophie','george','emma'):
 sheet=Image.new('RGB',(5*240,2*300+26),'#eeeeeb');draw=ImageDraw.Draw(sheet);draw.text((10,7),m.upper()+' / current model reference, corrected light colours',fill='#222')
 for row,g in enumerate(('tshirt','hoodie')):
  k=m+'-'+g
  black=load(k+'-black')
  khaki=arr(Image.open(root/'assets/models-v32'/ (k+'-khaki.webp')))
  burgundy=arr(Image.open(root/'assets/models-v32'/ (k+'-burgundy.webp')))
  gray,white=load(k+'-gray'),load(k+'-white')
  # The two visually reviewed pre-rendered colours differ only on fabric;
  # intersect their changes and exclude original blue denim and skin.
  delta=np.minimum(np.max(abs(khaki-black),axis=2),np.max(abs(burgundy-black),axis=2))
  alpha=smooth(2,25,delta)
  # Close small internal holes in the approved fabric mask; these otherwise appear as black spots on light cloth.
  interior=binary_fill_holes(binary_closing(alpha>.65,iterations=3))
  alpha=np.maximum(alpha,interior.astype(np.float32))
  l=black@np.array([.2126,.7152,.0722],dtype=np.float32)
  y,x=np.ogrid[:653,:596]
  blue=(black[:,:,2]-black[:,:,0]>6)&(black[:,:,1]-black[:,:,0]>3)&(y>420)
  skin=(black[:,:,0]-black[:,:,2]>32)&(l>60)
  alpha[blue|skin]=0
  # In the middle of solid cloth, remove small spots caused by prior recolouring masks.
  alpha[y.repeat(596,axis=1)<175]=0
  alpha=np.clip(gaussian_filter(alpha,.4),0,1);alpha[blue|skin]=0
  base=black.copy()
  if k=='george-hoodie':
   q=np.sqrt(((x-299)/61)**2+((y-169)/38)**2)
   blend=(1-smooth(.68,1,q))[...,None];base=base*(1-blend)+gray*blend
   alpha[(y<205)&(x>237)&(x<361)]=0
  for c,ref in [('white',white),('gray',gray)]:
   # Preserve original photo outside garment, including every blue denim pixel.
   im=np.rint(base*(1-alpha[...,None])+ref*alpha[...,None]).clip(0,255).astype('uint8')
   # Retouch compact black mask defects inside the fabric (not the garment edge).
   # These are genuine source-photo imperfections, not natural garment folds.
   Y=im@np.array([.2126,.7152,.0722],dtype=np.float32)
   med=median_filter(Y,size=15)
   limit={'jack-tshirt':573,'jack-hoodie':591,'sophie-tshirt':513,'sophie-hoodie':549,'george-tshirt':607,'george-hoodie':600,'emma-tshirt':509,'emma-hoodie':571}[k]
   cloth=binary_fill_holes(binary_closing(alpha>.55,iterations=5))
   cloth=binary_dilation(cloth,iterations=3)&(y>235)&(y<limit)&~blue&~skin
   defect=cloth&(Y<(120 if c=='white' else 74))&(med-Y>(45 if c=='white' else 28))&(med>(150 if c=='white' else 92))
   labs,num=label(defect)
   count=np.bincount(labs.ravel());small=(count>0)&(count<360);small[0]=False
   defect=binary_dilation(small[labs],iterations=2)&cloth
   # Known rectangular source defects can extend beyond earlier colour masks.
   regions={
    'jack-tshirt':[(331,433,356,458),(209,513,233,530)],
    'jack-hoodie':[(321,417,343,437),(305,450,330,466),(130,432,148,452),(449,416,476,441),(445,448,480,469),(430,473,498,491),(369,530,391,549),(319,546,344,560),(203,560,224,576)],
    'emma-hoodie':[(304,482,333,507),(340,516,355,530),(120,436,166,473),(438,421,475,473),(470,466,490,485)],
    'george-hoodie':[(239,451,259,470),(400,419,420,435),(476,483,491,498)],
   }
   for x1,y1,x2,y2 in regions.get(k,[]):
    zone=(x>=x1)&(x<x2)&(y>=y1)&(y<y2)
    extra=zone&(Y<(120 if c=='white' else 75))&(med-Y>25)&~blue&~skin
    defect|=binary_dilation(extra,iterations=2)&zone&~blue&~skin
   if defect.any():
    valid=~defect
    weight=gaussian_filter(valid.astype(np.float32),5)
    restored=np.stack([gaussian_filter(im[:,:,ch].astype(np.float32)*valid,5)/np.maximum(weight,.001) for ch in range(3)],axis=2)
    im[defect]=np.rint(restored[defect]).clip(0,255).astype('uint8')
   assert np.array_equal(im[blue],black.astype('uint8')[blue])
   Image.fromarray(im).save(out/(k+'-'+c+'.webp'),lossless=True,method=6)
  for col,c in enumerate(('black','white','gray','khaki','burgundy')):
   im=Image.fromarray(base.astype('uint8')) if c=='black' else Image.open((out if c in ('white','gray') else root/'assets/models-v32')/(k+'-'+c+'.webp'))
   im=im.copy();im.thumbnail((225,255));xx=col*240;yy=26+row*300
   sheet.paste(im,(xx+(240-im.width)//2,yy+22));draw.text((xx+8,yy+4),g+' / '+c,fill='#222')
 sheet.save(qa/(m+'-current-variants.jpg'),quality=92)
print('16 corrected light garments; original jeans pixels preserved; 4 review sheets')
