from pathlib import Path
import base64,io,json
import numpy as np
from PIL import Image,ImageDraw
from scipy.ndimage import gaussian_filter,binary_fill_holes,binary_closing,binary_dilation,label
root=Path(__file__).resolve().parents[1]
src=json.loads((root/'assets/models-v4.js').read_text().split('Object.freeze(',1)[1].rsplit(')',1)[0])
out=root/'assets/models-v41-light';out.mkdir(exist_ok=True)
qa=root/'qa-v41-light';qa.mkdir(exist_ok=True)
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
  gl=gray@np.array([.2126,.7152,.0722],dtype=np.float32)
  wl=white@np.array([.2126,.7152,.0722],dtype=np.float32)
  y,x=np.ogrid[:653,:596]
  # Fill missed fabric pixels with the registered original light photographs.
  # Use agreement of both light variants, not darkness alone. Guard the
  # neckline, hands, jewelry and denim against false positives.
  old_support=alpha>.2
  support=binary_dilation(old_support,iterations=12)
  diff=smooth(7,25,np.minimum(gl-l,wl-l))
  neutral=1-smooth(24,52,black.max(axis=2)-black.min(axis=2))
  alpha=np.maximum(alpha,diff*neutral*support)
  # Within the established fabric interior, retain the original light
  # texture instead of leaving isolated black holes from earlier masks.
  core=binary_fill_holes(binary_closing(alpha>.55,iterations=5))
  alpha=np.maximum(alpha,core.astype(np.float32))
  hem_curves={
   'jack-tshirt':[(0,574),(180,574),(215,578),(260,581),(306,582),(355,580),(406,574),(595,574)],
   'sophie-tshirt':[(0,513),(209,513),(244,518),(280,521),(310,521),(352,518),(390,510),(595,510)],
   'george-tshirt':[(0,608),(196,607),(223,616),(258,625),(300,628),(336,626),(371,620),(401,609),(595,609)],
   'emma-tshirt':[(0,510),(170,510),(199,510),(220,516),(250,523),(290,528),(325,528),(356,523),(380,518),(410,509),(595,509)],
   'jack-hoodie':[(0,593),(190,588),(245,594),(350,594),(407,588),(595,593)],
   'sophie-hoodie':[(0,555),(215,550),(248,556),(353,556),(390,550),(595,555)],
   'george-hoodie':[(0,605),(210,599),(249,605),(361,605),(407,598),(595,605)],
   'emma-hoodie':[(0,578),(210,570),(244,578),(378,577),(420,570),(595,578)]
  }
  hx,hy=zip(*hem_curves[k]);hem=np.interp(np.arange(596),hx,hy)[None,:]
  alpha*=1-smooth(-.7,1,y-hem)
  # Restore every source watch/bracelet pixel from the black reference, not
  # the previous light recolour. The contours are localized to the wrists.
  jewelry={
   'jack-tshirt':[(423,560,480,598)],
   'jack-hoodie':[(140,535,193,585),(421,550,464,587)],
   'sophie-tshirt':[(396,471,427,508)],
   'sophie-hoodie':[(422,510,457,550)],
   'george-tshirt':[(121,550,178,595),(431,561,481,610)],
   'george-hoodie':[(428,548,485,593)],
   'emma-tshirt':[(132,450,179,492),(421,461,454,502)],
   'emma-hoodie':[(146,517,192,562),(433,523,473,565)]
  }
  for xa,ya,xb,yb in jewelry.get(k,[]):
   region=(x>=xa)&(x<=xb)&(y>=ya)&(y<=yb)
   # Do not revert cloth in the wrist rectangle: protect only pixels where
   # the old, verified green/burgundy image was unchanged from black.
   alpha[region&(delta<5)]=0
  blue=(black[:,:,2]-black[:,:,0]>6)&(black[:,:,1]-black[:,:,0]>3)&(y>hem-26)
  # A blueish cloth fold is not denim. Require a connected jeans component
  # reaching the image's bottom row rather than classifying isolated pixels.
  lab,n=label(binary_closing(blue,iterations=1))
  bottom_ids=np.unique(lab[648]);bottom_ids=bottom_ids[bottom_ids!=0]
  jeans=binary_fill_holes(np.isin(lab,bottom_ids))
  jeans|=(blue & binary_dilation(jeans,iterations=1))
  denim_guard=jeans|(y>=hem+1)
  skin=(black[:,:,0]-black[:,:,2]>32)&(l>60)
  alpha[denim_guard|skin]=0
  # In the middle of solid cloth, remove small spots caused by prior recolouring masks.
  alpha[y.repeat(596,axis=1)<175]=0
  alpha=np.clip(gaussian_filter(alpha,.4),0,1);alpha[denim_guard|skin]=0
  base=black.copy()
  if k=='george-hoodie':
   q=np.sqrt(((x-299)/61)**2+((y-169)/38)**2)
   blend=(1-smooth(.68,1,q))[...,None];base=base*(1-blend)+gray*blend
   # Protect actual beard and neck via the skin/colour evidence, not a rectangular cutout.
  for c,ref in [('white',white),('gray',gray)]:
   # Preserve original photo outside garment, including every blue denim pixel.
   im=np.rint(base*(1-alpha[...,None])+ref*alpha[...,None]).clip(0,255).astype('uint8')
   assert np.array_equal(im[denim_guard],black.astype('uint8')[denim_guard])
   Image.fromarray(im).save(out/(k+'-'+c+'.webp'),lossless=True,method=6)
  for col,c in enumerate(('black','white','gray','khaki','burgundy')):
   im=Image.fromarray(base.astype('uint8')) if c=='black' else Image.open((out if c in ('white','gray') else root/'assets/models-v32')/(k+'-'+c+'.webp'))
   im=im.copy();im.thumbnail((225,255));xx=col*240;yy=26+row*300
   sheet.paste(im,(xx+(240-im.width)//2,yy+22));draw.text((xx+8,yy+4),g+' / '+c,fill='#222')
 sheet.save(qa/(m+'-current-variants.jpg'),quality=92)
print('16 corrected light garments; original jeans pixels preserved; 4 review sheets')
