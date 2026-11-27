from pathlib import Path
import base64,io,re
import numpy as np
from PIL import Image,ImageDraw,ImageFont,ImageCms
from scipy.ndimage import gaussian_filter,binary_dilation
root=Path(__file__).resolve().parents[1]
def embedded(p):
 s=(root/p).read_text()
 return Image.open(io.BytesIO(base64.b64decode(re.search(r'href="data:image/[^;]+;base64,([^"]+)"',s)[1])))
source=embedded('assets/dfm-art-nsu.svg').convert('RGB')
assert source.size==(1200,800)
W,H=1200,608
rgb=np.array(source.crop((0,0,W,H)))
old=embedded('assets/dfm-print-nsu.svg').convert('RGBA')
oldalpha=np.array(old.getchannel('A').resize((W,H),Image.Resampling.LANCZOS))
def poly(points):
 im=Image.new('L',(W,H));ImageDraw.Draw(im).polygon(points,fill=255);return np.array(im)>0
def line(points,width):
 im=Image.new('L',(W,H));ImageDraw.Draw(im).line(points,fill=255,width=width,joint='curve');return np.array(im)>0
# Traced outer tire and rim boundaries from the approved original photo.
rear_outer=[(78,335),(89,288),(113,250),(147,222),(183,209),(226,205),(271,216),(311,239),(348,276),(371,319),(383,366),(384,410),(372,460),(349,504),(315,537),(277,557),(231,563),(185,555),(145,535),(112,501),(91,459),(79,414),(73,373)]
rear_inner=[(124,345),(139,310),(162,283),(194,267),(228,263),(263,270),(293,288),(318,316),(334,351),(341,385),(333,423),(316,454),(290,479),(262,496),(230,503),(197,497),(168,482),(145,456),(131,426),(122,390)]
front_outer=[(786,350),(797,305),(823,264),(857,235),(901,216),(946,212),(992,221),(1036,241),(1080,271),(1115,306),(1141,344),(1162,388),(1172,433),(1168,476),(1150,514),(1121,544),(1082,562),(1036,575),(991,572),(947,558),(905,536),(867,505),(834,467),(808,425),(793,386)]
front_inner=[(835,349),(847,316),(870,286),(899,269),(933,263),(969,269),(1007,283),(1041,304),(1071,333),(1094,369),(1110,407),(1117,446),(1107,477),(1088,503),(1061,520),(1029,528),(995,522),(960,511),(929,491),(899,466),(873,433),(852,397)]
wheel= (poly(rear_outer)&~poly(rear_inner))|(poly(front_outer)&~poly(front_inner))
# Limit the inherited cutout to the actual motorcycle silhouette; exclude the floor shadow.
allowed=poly([(32,308),(46,280),(79,244),(105,215),(121,167),(137,159),(286,160),(335,174),(348,149),(382,147),(425,159),(479,153),(526,153),(555,134),(590,115),(628,102),(670,95),(701,88),(738,81),(762,47),(800,31),(850,25),(878,11),(916,17),(942,45),(950,81),(948,108),(931,137),(902,148),(909,179),(948,172),(986,165),(1034,168),(1076,185),(1126,209),(1134,220),(1111,230),(1141,268),(1164,308),(1181,370),(1183,470),(1158,525),(1117,565),(1060,580),(982,579),(912,556),(858,516),(815,462),(785,407),(760,463),(733,487),(699,515),(645,520),(570,520),(501,509),(425,500),(375,495),(350,532),(310,552),(267,566),(208,565),(153,545),(111,512),(84,474),(65,413),(46,413),(42,387),(52,339)])
# Opaque solid tank, saddle, lamp, cylinder/head, crankcase, toolbox, exhaust, hubs.
solids=[
 [(500,202),(531,168),(569,149),(614,127),(660,112),(705,105),(743,112),(762,133),(767,161),(755,190),(732,218),(710,228),(625,230),(548,221),(517,212)],
 [(349,149),(384,151),(432,164),(475,162),(521,153),(536,162),(524,182),(496,198),(455,204),(410,198),(374,187),(353,176)],
 [(855,48),(873,28),(899,18),(919,20),(938,44),(948,72),(944,100),(930,122),(907,130),(883,119),(863,101),(854,78)],
 [(550,247),(602,242),(645,246),(693,252),(700,277),(693,300),(686,328),(674,350),(640,367),(583,363),(560,345),(557,309)],
 [(532,351),(566,349),(608,363),(651,374),(684,387),(703,411),(696,443),(675,467),(645,484),(599,484),(563,465),(537,442),(521,409)],
 [(302,337),(319,326),(349,329),(365,341),(363,382),(347,391),(312,388),(301,376)],
 [(108,417),(144,410),(196,425),(248,440),(308,449),(369,458),(424,466),(489,471),(551,479),(620,484),(670,478),(693,470),(714,449),(727,423),(731,395),(726,370),(713,349),(690,332),(678,322),(681,308),(697,312),(718,329),(739,350),(750,377),(751,408),(742,441),(722,471),(698,493),(659,506),(615,508),(553,503),(487,496),(420,489),(354,481),(290,474),(230,463),(173,452),(127,443),(109,436)],
 [(196,369),(214,359),(236,363),(251,381),(246,405),(226,421),(204,410),(194,391)],
 [(943,379),(964,362),(989,369),(1010,392),(1009,416),(989,438),(965,435),(944,417),(936,396)]
]
solid=wheel.copy()
for points in solids:solid|=poly(points)
# Thin dark frame and fork tubes: preserve only the real physical structure.
for points,width in [([(218,386),(490,238),(535,207)],13), ([(355,449),(411,285),(490,238)],11), ([(404,287),(424,472)],12), ([(760,149),(717,361),(700,443)],15), ([(785,160),(884,295),(971,398)],14), ([(813,158),(904,287),(985,393)],12), ([(778,489),(970,399)],9), ([(125,181),(214,384)],6), ([(277,174),(228,380)],6)]:solid|=line(points,width)
# Keep real visible fine spokes and metallic edges, not empty holes.
luma=rgb.max(axis=2)
fine=(oldalpha>45)&(luma>17)&allowed
mask=(solid|fine)&allowed
# Remove only isolated specks outside solid components and retain thin connected spokes.
from scipy.ndimage import label
lab,n=label(mask)
counts=np.bincount(lab.ravel());valid=counts>=4;valid[0]=False
mask=valid[lab]
alpha=np.where(mask,255,0).astype('uint8')
# Antialias only at the outside edge, retain fully opaque interior pixels.
edge=gaussian_filter(alpha.astype(np.float32),.42)
alpha=np.where(mask,255,np.where(edge>=18,edge,0)).astype('uint8')
motor=Image.fromarray(np.dstack((rgb,alpha)),'RGBA')
bbox=motor.getbbox();motor=motor.crop(bbox)
out=root/'assets/nsu-v41';out.mkdir(exist_ok=True)
qa=root/'qa-nsu-v41';qa.mkdir(exist_ok=True)
# Resize premultiplied RGBA to avoid colour bleed; restore interior opacity.
motor=motor.resize((2700,round(motor.height*2700/motor.width)),Image.Resampling.LANCZOS)
a=np.array(motor.getchannel('A'));a[a>=250]=255;a[a<5]=0;motor.putalpha(Image.fromarray(a))
canvas=Image.new('RGBA',(3000,2000));canvas.alpha_composite(motor,(150,65))
draw=ImageDraw.Draw(canvas);font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSerif-BoldItalic.ttf',91);small=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf',58)
draw.text((2800,1645),'NSU 500 1T – 1930',font=font,fill='#f5e9d0',anchor='ra');draw.text((2800,1790),'daveferrymotors.com',font=small,fill='#f5e9d0',anchor='ra')
icc=ImageCms.ImageCmsProfile(ImageCms.createProfile('sRGB')).tobytes()
canvas.save(out/'nsu-500-1t-1930.png',icc_profile=icc,optimize=True)
motor.resize((1350,round(motor.height*.5)),Image.Resampling.LANCZOS).save(out/'nsu-motor.webp',lossless=True,method=6,icc_profile=icc)
sheet=Image.new('RGB',(1000,5*290),'#eee');d=ImageDraw.Draw(sheet)
for i,(name,col) in enumerate([('Black','#171717'),('White','#ffffff'),('Grey','#898989'),('Military Green','#626b46'),('Burgundy','#722f37')]):
 bg=Image.new('RGBA',(1000,290),col);im=motor.copy();im.thumbnail((880,250));bg.alpha_composite(im,((1000-im.width)//2,25));sheet.paste(bg.convert('RGB'),(0,i*290));d.text((10,i*290+6),name,fill='#f5e9d0' if i in (0,3,4) else '#171717')
sheet.save(qa/'five-colours.jpg',quality=94)
print('NSU rendered from original 1200 px photo; 3000 x 2000 PNG; interior alpha 255 and exterior 0; manual mask visual review still required')
