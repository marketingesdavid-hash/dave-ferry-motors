from pathlib import Path
import base64,io,json
import numpy as np
from PIL import Image,ImageDraw
from scipy.ndimage import gaussian_filter,binary_fill_holes,binary_closing,label,distance_transform_edt
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
  # Recover the exact common fabric mask and shade from the two reviewed,
  # lossless colour renders. This avoids reusing black defects in old light photos.
  base=black.copy()
  y,x=np.ogrid[:653,:596]
  if k=='george-hoodie':
   q=np.sqrt(((x-299)/61)**2+((y-169)/38)**2)
   blend=(1-smooth(.68,1,q))[...,None];base=base*(1-blend)+gray*blend
  weights=np.array([.2126,.7152,.0722],dtype=np.float32)
  L=base@weights
  diff=np.array([-16.,60.,15.],dtype=np.float32)
  shadealpha=((khaki-burgundy)@diff)/(diff@diff)
  shadealpha=np.clip(shadealpha,0,1.4)
  alpha=(shadealpha*(np.array([98,107,70])@weights)-(khaki-base)@weights)/np.maximum(L,4)
  alpha=np.clip(alpha,0,1)
  alpha=np.where(shadealpha>.008,alpha,0)
  shade=np.clip(shadealpha/np.maximum(alpha,.005),.60,1.40)
  # Fill tiny holes inside fabric only. Avoid wrists, eyes, hair, denim and background.
  core=alpha>.70
  filled=binary_fill_holes(binary_closing(core,iterations=3))
  holes=filled&~core
  labs,num=label(holes)
  counts=np.bincount(labs.ravel());small=(counts>0)&(counts<=350);small[0]=False
  holes=small[labs]&(L<95)&((base.max(axis=2)-base.min(axis=2))<35)
  nearest=distance_transform_edt(~core,return_distances=False,return_indices=True)
  shade[holes]=shade[tuple(nearest)][holes]
  alpha[holes]=1
  blue=(black[:,:,2]-black[:,:,0]>6)&(black[:,:,1]-black[:,:,0]>3)&(y>420)
  skin=(black[:,:,0]-black[:,:,2]>32)&(L>60)
  protected=blue|skin|(y<175)|(L>180)
  if k=='george-hoodie':
   protected|=(y<205)&(x>237)&(x<361)
  alpha[protected]=0
  # The reviewed preview colours define the same garment boundary. Generate
  # new neutral light fabric directly, without old white or gray texture defects.
  for c,target in [('white',221.),('gray',137.)]:
   # Keep natural luminance detail in the original dark photograph at full opacity.
   detail=L-gaussian_filter(L,1.2)
   cloth=np.clip(shade*target+detail*.32,0,255)
   tint=np.repeat(cloth[...,None],3,axis=2)
   im=np.rint(base*(1-alpha[...,None])+tint*alpha[...,None]).clip(0,255).astype('uint8')
   assert np.array_equal(im[blue],black.astype('uint8')[blue])
   Image.fromarray(im).save(out/(k+'-'+c+'.webp'),lossless=True,method=6)
  for col,c in enumerate(('black','white','gray','khaki','burgundy')):
   im=Image.fromarray(base.astype('uint8')) if c=='black' else Image.open((out if c in ('white','gray') else root/'assets/models-v32')/(k+'-'+c+'.webp'))
   im=im.copy();im.thumbnail((225,255));xx=col*240;yy=26+row*300
   sheet.paste(im,(xx+(240-im.width)//2,yy+22));draw.text((xx+8,yy+4),g+' / '+c,fill='#222')
 sheet.save(qa/(m+'-current-variants.jpg'),quality=92)
print('16 corrected light garments; original jeans pixels preserved; 4 review sheets')
