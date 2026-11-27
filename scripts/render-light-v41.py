from pathlib import Path
import base64,io,json
import numpy as np
from PIL import Image,ImageDraw
from scipy.ndimage import gaussian_filter,binary_fill_holes,binary_closing
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
   assert np.array_equal(im[blue],black.astype('uint8')[blue])
   Image.fromarray(im).save(out/(k+'-'+c+'.webp'),lossless=True,method=6)
  for col,c in enumerate(('black','white','gray','khaki','burgundy')):
   im=Image.fromarray(base.astype('uint8')) if c=='black' else Image.open((out if c in ('white','gray') else root/'assets/models-v32')/(k+'-'+c+'.webp'))
   im=im.copy();im.thumbnail((225,255));xx=col*240;yy=26+row*300
   sheet.paste(im,(xx+(240-im.width)//2,yy+22));draw.text((xx+8,yy+4),g+' / '+c,fill='#222')
 sheet.save(qa/(m+'-current-variants.jpg'),quality=92)
print('16 corrected light garments; original jeans pixels preserved; 4 review sheets')
