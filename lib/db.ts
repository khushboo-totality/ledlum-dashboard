import { v4 as uuidv4 } from 'uuid'
import type { Product } from '@/types'

// In production replace with Prisma/MongoDB/Supabase
const SEED: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>[] = [
    {
      "Codes": "LLO-129G",
      "Category": "Floor",
      "ImageLink": "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=600",
      "source": "internal",
      "zone": "zone-a"
    },
    {
      "Codes": "LB-175",
      "Category": "Floor",
      "ImageLink": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600",
      "source": "internal",
      "zone": "zone-a"
    },
    {
      "Codes": "LB-218",
      "Category": "Floor",
      "ImageLink": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600",
      "source": "internal",
      "zone": "zone-a"
    },
    {
      "Codes": "LB-263",
      "Category": "Floor",
      "ImageLink": "https://images.unsplash.com/photo-1615873968403-89e068629265?w=600",
      "source": "internal",
      "zone": "zone-a"
    },
    {
      "Codes": "LPL-007",
      "Category": "Floor",
      "ImageLink": "https://drive.google.com/file/d/1JneU5QSMSpYTzI261QutUeyONf8hy4of/view?usp=drivesdk",
      "source": "internal",
      "zone": "zone-a"
    },
    {
      "Codes": "LLO-124",
      "Category": "Floor",
      "ImageLink": "https://drive.google.com/file/d/1aUQRDDPBZy_zBSB3p0rqEAiVMfVK_3IG/view?usp=drivesdk",
      "source": "internal",
      "zone": "zone-a"
    },
    {
      "Codes": "LB-166",
      "Category": "Floor",
      "ImageLink": "https://drive.google.com/file/d/1DkKFQ5Betr3Q8uAbtt_8oC9UAO09STAM/view?usp=drivesdk",
      "source": "internal",
      "zone": "zone-a"
    },
    {
      "Codes": "LB-228",
      "Category": "Floor",
      "ImageLink": "https://drive.google.com/file/d/1C49cbkOUxWXUROmWoYYSRuZ9WNDcVVLd/view?usp=drivesdk",
      "source": "internal",
      "zone": "zone-a"
    },
    {
      "Codes": "LLO-129I",
      "Category": "Floor",
      "ImageLink": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600",
      "source": "internal",
      "zone": "zone-a"
    },
    {
      "Codes": "LPL-028",
      "Category": "Floor",
      "ImageLink": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600",
      "source": "internal",
      "zone": "zone-a"
    },
    {
      "Codes": "LB-265",
      "Category": "Floor",
      "ImageLink": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600",
      "source": "internal",
      "zone": "zone-a"
    },
    {
      "Codes": "LB-272",
      "Category": "Floor",
      "ImageLink": "https://images.unsplash.com/photo-1615873968403-89e068629265?w=600",
      "source": "internal",
      "zone": "zone-a"
    },
    {
      "Codes": "LLO-129K",
      "Category": "Floor",
      "ImageLink": "https://drive.google.com/file/d/11gZFJK5AohNL6M45s_fOCRjiiNduRNdA/view?usp=drivesdk",
      "source": "internal",
      "zone": "zone-a"
    },
    {
      "Codes": "LPL-010",
      "Category": "Floor",
      "ImageLink": "https://drive.google.com/file/d/1k18r3qRxjjkUQNzmTMmQQKVyzRwPpzv7/view?usp=drivesdk",
      "source": "internal",
      "zone": "zone-a"
    },
    {
      "Codes": "LSO-038-41",
      "Category": "Floor",
      "ImageLink": "https://images.unsplash.com/photo-1615873968403-89e068629265?w=600",
      "source": "internal",
      "zone": "zone-a"
    },
    {
      "Codes": "LB-249",
      "Category": "Floor",
      "ImageLink": "https://drive.google.com/file/d/1Zbc0SZMQ2pWLSGfzr5eOqS9rEPk21He7/view?usp=drivesdk",
      "source": "internal",
      "zone": "zone-a"
    },
    {
      "Codes": "LLO-129P",
      "Category": "Floor",
      "ImageLink": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600",
      "source": "internal",
      "zone": "zone-a"
    },
    {
      "Codes": "LLO-1009",
      "Category": "Floor",
      "ImageLink": "https://drive.google.com/file/d/1FDAA_I0irjfeL5YpbihA3DJb8cEA3_rf/view?usp=drivesdk",
      "source": "internal",
      "zone": "zone-a"
    },
    {
      "Codes": "LLO-1033",
      "Category": "Floor",
      "ImageLink": "https://drive.google.com/file/d/14EeCpvCe4j_VjCC6Ej9M_blP27FGGoyr/view?usp=drivesdk",
      "source": "internal",
      "zone": "zone-a"
    },
    {
      "Codes": "LB-254",
      "Category": "Floor",
      "ImageLink": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600",
      "source": "internal",
      "zone": "zone-a"
    },
    {
      "Codes": "LPL-021",
      "Category": "Floor",
      "ImageLink": "https://drive.google.com/file/d/1dqb5HM9FSOytQQ2iuSZl3fNmbGvOyV1p/view?usp=drivesdk",
      "source": "internal",
      "zone": "zone-a"
    },
    {
      "Codes": "LB-256",
      "Category": "Floor",
      "ImageLink": "https://drive.google.com/file/d/1E9D8DFXQFsOwEhPNi822ruGQ9zUgajV9/view?usp=drivesdk",
      "source": "internal",
      "zone": "zone-a"
    },
    {
      "Codes": "LSO-007-10",
      "Category": "Floor",
      "ImageLink": "https://drive.google.com/file/d/1cDgDnC53Gpj2_qwNj73DmvK6RUq76jIm/view?usp=drivesdk",
      "source": "internal",
      "zone": "zone-a"
    },
    {
      "Codes": "LLO-1050",
      "Category": "Floor",
      "ImageLink": "https://drive.google.com/file/d/1G3GMGwBuGc74weI4VsAZMpBQ8wPDJNCd/view?usp=drivesdk",
      "source": "internal",
      "zone": "zone-a"
    },
    {
      "Codes": "LSO-042",
      "Category": "Floor",
      "ImageLink": "https://drive.google.com/file/d/1sHFfafJaQVZN6z9vQ1JM1XaI7EhQv45h/view?usp=drivesdk",
      "source": "internal",
      "zone": "zone-a"
    },
    {
      "Codes": "LLO-095A",
      "Category": "Floor",
      "ImageLink": "https://drive.google.com/file/d/1gCN6oh_7_KF7h5wxpGLEoggCJqll6dBd/view?usp=drivesdk",
      "source": "internal",
      "zone": "zone-a"
    },
    {
      "Codes": "LLO-139L",
      "Category": "Floor",
      "ImageLink": "https://images.unsplash.com/photo-1615873968403-89e068629265?w=600",
      "source": "internal",
      "zone": "zone-a"
    },
    {
      "Codes": "LLO-1037",
      "Category": "Floor",
      "ImageLink": "https://drive.google.com/file/d/1AM3CDeMo2nG_JXBoRF8O4qRYAsCUhXBr/view?usp=drivesdk",
      "source": "internal",
      "zone": "zone-a"
    },
    {
      "Codes": "LLO-1003",
      "Category": "Floor",
      "ImageLink": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600",
      "source": "internal",
      "zone": "zone-a"
    },
    {
      "Codes": "LLO-1024",
      "Category": "Floor",
      "ImageLink": "https://drive.google.com/file/d/1ViqdcuhuCy7PiHyD0AGi0pFWc38f7w13/view?usp=drivesdk",
      "source": "internal",
      "zone": "zone-a"
    },
    {
      "Codes": "LLO-1051",
      "Category": "Floor",
      "ImageLink": "https://drive.google.com/file/d/1nZDmfFMG_1CVojIIGsiF70S2_WPSrk2D/view?usp=drivesdk",
      "source": "internal",
      "zone": "zone-a"
    },
    {
      "Codes": "LLO-094A",
      "Category": "Floor",
      "ImageLink": "https://drive.google.com/file/d/1OFmaL89uBpUIXMDpevUT879T6roPsUGI/view?usp=drivesdk",
      "source": "internal",
      "zone": "zone-a"
    },
    {
      "Codes": "LLO-1001",
      "Category": "Floor",
      "ImageLink": "https://drive.google.com/file/d/1u1nCPShASUyJwi9W3WnUW9xrNWylSjas/view?usp=drivesdk",
      "source": "internal",
      "zone": "zone-a"
    },
    {
      "Codes": "LPL-011",
      "Category": "Floor",
      "ImageLink": "https://drive.google.com/file/d/1HlP0JerxWLMTaeuytC3k9xcHSMAlzozr/view?usp=drivesdk",
      "source": "internal",
      "zone": "zone-a"
    },
    {
      "Codes": "LSO-002-006",
      "Category": "Floor",
      "ImageLink": "https://drive.google.com/file/d/1uHfalR1zY4FrchulqZWbo6OT5X4vxVG_/view?usp=drivesdk",
      "source": "internal",
      "zone": "zone-a"
    },
    {
      "Codes": "LL+-WN45*-SPIKE GROUP",
      "Category": "Floor",
      "ImageLink": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600",
      "source": "internal",
      "zone": "zone-a"
    },
    {
      "Codes": "LL+-WN-9*SPIKE GROUP",
      "Category": "Floor",
      "ImageLink": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600",
      "source": "internal",
      "zone": "zone-a"
    },
    {
      "Codes": "LL+-WN-9*SPIKE",
      "Category": "Wall",
      "ImageLink": "https://images.unsplash.com/photo-1615873968403-89e068629265?w=600",
      "source": "internal",
      "zone": "zone-a"
    },
    {
      "Codes": "LL+-WN-45*-SPIKE",
      "Category": "Wall",
      "ImageLink": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600",
      "source": "internal",
      "zone": "zone-a"
    },
    {
      "Codes": "LL+-WN-SPIKE-9*",
      "Category": "Wall",
      "ImageLink": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600",
      "source": "internal",
      "zone": "zone-a"
    },
    {
      "Codes": "LL+-SPIKE-45*-WN",
      "Category": "Wall",
      "ImageLink": "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=600",
      "source": "internal",
      "zone": "zone-a"
    },
    {
      "Codes": "KAPEGO-1WAY",
      "Category": "Wall",
      "ImageLink": "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=600",
      "source": "internal",
      "zone": "zone-a"
    },
    {
      "Codes": "LL+-SVR-3D-FL",
      "Category": "Wall",
      "ImageLink": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600",
      "source": "internal",
      "zone": "zone-a"
    },
    {
      "Codes": "LL+-NEON-SS-2",
      "Category": "Wall",
      "ImageLink": "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=600",
      "source": "internal",
      "zone": "zone-a"
    },
    {
      "Codes": "ZONE-B1",
      "Category": "Wall",
      "ImageLink": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600",
      "source": "internal",
      "zone": "zone-b"
    },
    {
      "Codes": "LLWW-021",
      "Category": "Wall",
      "ImageLink": "https://drive.google.com/file/d/1aORj09x0zMpXs365dHiQEOPpIpf1PxtC/view?usp=drivesdk",
      "source": "internal",
      "zone": "zone-b"
    },
    {
      "Codes": "LLO-006",
      "Category": "Floor",
      "ImageLink": "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=600",
      "source": "internal",
      "zone": "zone-b"
    },
    {
      "Codes": "LLO-006A",
      "Category": "Fixture",
      "ImageLink": "https://drive.google.com/file/d/1dGdjZFAoJ_ZIfeY9aXgazcsP8alPQcPG/view?usp=drivesdk",
      "source": "internal",
      "zone": "zone-b"
    },
    {
      "Codes": "LLO-094",
      "Category": "Ceiling",
      "ImageLink": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600",
      "source": "internal",
      "zone": "zone-b"
    },
    {
      "Codes": "LLO-1014",
      "Category": "Wall",
      "ImageLink": "https://drive.google.com/file/d/19zbftFIOIzgWn_WqmoMI2EeYKt42lWlx/view?usp=drivesdk",
      "source": "internal",
      "zone": "zone-b"
    },
    {
      "Codes": "LLO-1032",
      "Category": "Light",
      "ImageLink": "https://drive.google.com/file/d/16C1t7PYTl2t10moQjXAywiyKi54HgNVA/view?usp=drivesdk",
      "source": "internal",
      "zone": "zone-b"
    },
    {
      "Codes": "LLO-1049",
      "Category": "Accent",
      "ImageLink": "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=600",
      "source": "internal",
      "zone": "zone-b"
    },
    {
      "Codes": "LLO-099B",
      "Category": "Floor",
      "ImageLink": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600",
      "source": "internal",
      "zone": "zone-b"
    },
    {
      "Codes": "LLO-099G",
      "Category": "Light",
      "ImageLink": "https://drive.google.com/file/d/1uFyjKlhtbxxqesV76Drw3nROzoBoWdzR/view?usp=drivesdk",
      "source": "internal",
      "zone": "zone-b"
    },
    {
      "Codes": "LLO-099J",
      "Category": "Wall",
      "ImageLink": "https://drive.google.com/file/d/195lhRv4NrQ8D7bwSuCOofRpR185tJdf1/view?usp=drivesdk",
      "source": "internal",
      "zone": "zone-b"
    },
    {
      "Codes": "LLO-099M",
      "Category": "Wall",
      "ImageLink": "https://drive.google.com/file/d/1JbpJpeb1lt4ZB3dlsKIYVdZKPad9549K/view?usp=drivesdk",
      "source": "internal",
      "zone": "zone-b"
    },
    {
      "Codes": "LLO-099R",
      "Category": "Floor",
      "ImageLink": "https://drive.google.com/file/d/1GV_NuqSgVQQCj5A2PQGG6Hx18PY4V4v4/view?usp=drivesdk",
      "source": "internal",
      "zone": "zone-b"
    },
    {
      "Codes": "LLO-099V",
      "Category": "Accent",
      "ImageLink": "https://drive.google.com/file/d/1UuKe8MSwcneqTmjci11OxSnmq0VkIGUV/view?usp=drivesdk",
      "source": "internal",
      "zone": "zone-b"
    },
    {
      "Codes": "LLO-099W",
      "Category": "Floor",
      "ImageLink": "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=600",
      "source": "internal",
      "zone": "zone-b"
    },
    {
      "Codes": "LLO-042",
      "Category": "Fixture",
      "ImageLink": "https://drive.google.com/file/d/1ZhjxsusgJ7xd2n_0hyDDKKF4kv6tDUFu/view?usp=drivesdk",
      "source": "internal",
      "zone": "zone-b"
    },
    {
      "Codes": "LLO-059",
      "Category": "Ceiling",
      "ImageLink": "https://drive.google.com/file/d/1kw1zRXZWvkrlro93zG6ks5NLzSU7rQ1j/view?usp=drivesdk",
      "source": "internal",
      "zone": "zone-b"
    },
    {
      "Codes": "LLO-045",
      "Category": "Ceiling",
      "ImageLink": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600",
      "source": "internal",
      "zone": "zone-b"
    },
    {
      "Codes": "LLO-059D",
      "Category": "Floor",
      "ImageLink": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600",
      "source": "internal",
      "zone": "zone-b"
    },
    {
      "Codes": "LLO-059E",
      "Category": "Wall",
      "ImageLink": "https://drive.google.com/file/d/1j74vox80C031BWBNqXywIK3w9bHgKntn/view?usp=drivesdk",
      "source": "internal",
      "zone": "zone-b"
    },
    {
      "Codes": "Wellnice 36w 10x60 deg - SI",
      "Category": "Wall",
      "ImageLink": "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=600",
      "source": "internal",
      "zone": "zone-b"
    },
    {
      "Codes": "Kap 1 way inground 2w - SI",
      "Category": "Floor",
      "ImageLink": "https://images.unsplash.com/photo-1615873968403-89e068629265?w=600",
      "source": "internal",
      "zone": "zone-b"
    },
    {
      "Codes": "Hemnord 36w Asssym slim WW20x40deg - S1",
      "Category": "Light",
      "ImageLink": "https://images.unsplash.com/photo-1615873968403-89e068629265?w=600",
      "source": "internal",
      "zone": "zone-b"
    },
    {
      "Codes": "LLo-1048 tree belt 5w 24deg - S2",
      "Category": "Wall",
      "ImageLink": "https://drive.google.com/file/d/1XmzKn9rPa1Pcai7qoaOUF70UZQs_fpx7/view?usp=drivesdk",
      "source": "internal",
      "zone": "zone-b"
    },
    {
      "Codes": "Kap 20w 15deg & hem 20w spike - S2",
      "Category": "Light",
      "ImageLink": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600",
      "source": "internal",
      "zone": "zone-b"
    },
    {
      "Codes": "Hemnord 36w 8 deg spike - S2",
      "Category": "Accent",
      "ImageLink": "https://images.unsplash.com/photo-1615873968403-89e068629265?w=600",
      "source": "internal",
      "zone": "zone-b"
    },
    {
      "Codes": "Kap 4 way inground - 1x2w - S2",
      "Category": "Accent",
      "ImageLink": "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=600",
      "source": "internal",
      "zone": "zone-b"
    },
    {
      "Codes": "Kapego 1 way 4w - S2",
      "Category": "Floor",
      "ImageLink": "https://images.unsplash.com/photo-1615873968403-89e068629265?w=600",
      "source": "internal",
      "zone": "zone-b"
    },
    {
      "Codes": "Hemnord 10w spike 8deg - S2",
      "Category": "Floor",
      "ImageLink": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600",
      "source": "internal",
      "zone": "zone-b"
    },
    {
      "Codes": "Wellnice WW 72w 8deg & Hem 3w 10deg inground -S2",
      "Category": "Wall",
      "ImageLink": "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=600",
      "source": "internal",
      "zone": "zone-b"
    },
    {
      "Codes": "Kap 2 way inground 2x2w - S3",
      "Category": "Accent",
      "ImageLink": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600",
      "source": "internal",
      "zone": "zone-b"
    },
    {
      "Codes": "Kapego 12deg 20W Spike - S3",
      "Category": "Fixture",
      "ImageLink": "https://images.unsplash.com/photo-1615873968403-89e068629265?w=600",
      "source": "internal",
      "zone": "zone-b"
    },
    {
      "Codes": "Hemnord spike 20w 8deg - S3",
      "Category": "Light",
      "ImageLink": "https://images.unsplash.com/photo-1615873968403-89e068629265?w=600",
      "source": "internal",
      "zone": "zone-b"
    },
    {
      "Codes": "Hem tiny spike 8 deg 5W- S3",
      "Category": "Floor",
      "ImageLink": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600",
      "source": "internal",
      "zone": "zone-b"
    },
    {
      "Codes": "Wellnice Honeycomb Black spike - S3",
      "Category": "Light",
      "ImageLink": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600",
      "source": "internal",
      "zone": "zone-b"
    },
    {
      "Codes": "Wellnice 36w 5 deg round - S3",
      "Category": "Light",
      "ImageLink": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600",
      "source": "internal",
      "zone": "zone-b"
    },
    {
      "Codes": "Wellnice 150W 3deg each 10x45deg WW - S4",
      "Category": "Fixture",
      "ImageLink": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600",
      "source": "internal",
      "zone": "zone-b"
    },
    {
      "Codes": "Hemnord 80w spike & Kapego 1 way 4w - S4",
      "Category": "Wall",
      "ImageLink": "https://images.unsplash.com/photo-1615873968403-89e068629265?w=600",
      "source": "internal",
      "zone": "zone-b"
    },
    {
      "Codes": "Wellnice square flood 18w 5deg - S4",
      "Category": "Wall",
      "ImageLink": "https://images.unsplash.com/photo-1615873968403-89e068629265?w=600",
      "source": "internal",
      "zone": "zone-b"
    },
    {
      "Codes": "Wellnice small 6 leg wall washar -S4",
      "Category": "Light",
      "ImageLink": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600",
      "source": "internal",
      "zone": "zone-b"
    },
    {
      "Codes": "Wellnice round Flood 120w 8 deg - S4",
      "Category": "Fixture",
      "ImageLink": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600",
      "source": "internal",
      "zone": "zone-b"
    },
    {
      "Codes": "Well Nice flood big square 5 deg - S4",
      "Category": "Fixture",
      "ImageLink": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600",
      "source": "internal",
      "zone": "zone-b"
    },
    {
      "Codes": "ZONE-C1",
      "Category": "Ceiling",
      "ImageLink": "https://images.unsplash.com/photo-1615873968403-89e068629265?w=600",
      "source": "internal",
      "zone": "zone-c"
    },
    {
      "Codes": "LLO-079Z",
      "Category": "Accent",
      "ImageLink": "https://images.unsplash.com/photo-1615873968403-89e068629265?w=600",
      "source": "internal",
      "zone": "zone-c"
    },
    {
      "Codes": "LB-221/LLO-159A",
      "Category": "Accent",
      "ImageLink": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600",
      "source": "internal",
      "zone": "zone-c"
    },
    {
      "Codes": "LB-253",
      "Category": "Ceiling",
      "ImageLink": "https://drive.google.com/file/d/1GZF68j7pdICnjD6WJjhr5Slpp5AemQU_/view?usp=drivesdk",
      "source": "internal",
      "zone": "zone-c"
    },
    {
      "Codes": "LB-252",
      "Category": "Accent",
      "ImageLink": "https://drive.google.com/file/d/1OQnsE_9s8mDwrefvVtHT6Zb7pefmDzQg/view?usp=drivesdk",
      "source": "internal",
      "zone": "zone-c"
    },
    {
      "Codes": "LPL-018",
      "Category": "Ceiling",
      "ImageLink": "https://images.unsplash.com/photo-1615873968403-89e068629265?w=600",
      "source": "internal",
      "zone": "zone-c"
    },
    {
      "Codes": "LWO-105",
      "Category": "Floor",
      "ImageLink": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600",
      "source": "internal",
      "zone": "zone-c"
    },
    {
      "Codes": "LSO-059,60,61",
      "Category": "Floor",
      "ImageLink": "https://drive.google.com/file/d/1EyvzI3HYv2OFYM63KNvNKAH5WbNvnjjB/view?usp=drivesdk",
      "source": "internal",
      "zone": "zone-c"
    },
    {
      "Codes": "LSO-015/21/35",
      "Category": "Accent",
      "ImageLink": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600",
      "source": "internal",
      "zone": "zone-c"
    },
    {
      "Codes": "LLO-1026",
      "Category": "Fixture",
      "ImageLink": "https://drive.google.com/file/d/1IKy4NGJat37zIrZqocPD468MNWWfbN02/view?usp=drivesdk",
      "source": "internal",
      "zone": "zone-c"
    },
    {
      "Codes": "LB-153",
      "Category": "Ceiling",
      "ImageLink": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600",
      "source": "internal",
      "zone": "zone-c"
    },
    {
      "Codes": "LSO-048",
      "Category": "Floor",
      "ImageLink": "https://images.unsplash.com/photo-1615873968403-89e068629265?w=600",
      "source": "internal",
      "zone": "zone-c"
    },
    {
      "Codes": "LWO-101",
      "Category": "Floor",
      "ImageLink": "https://drive.google.com/file/d/1IgSAnB6msMJ1Z2eipAz3wx3HT1acoKYD/view?usp=drivesdk",
      "source": "internal",
      "zone": "zone-c"
    },
    {
      "Codes": "LSO-049",
      "Category": "Floor",
      "ImageLink": "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=600",
      "source": "internal",
      "zone": "zone-c"
    },
    {
      "Codes": "LB-261",
      "Category": "Floor",
      "ImageLink": "https://drive.google.com/file/d/1Nlf4cVR_BDmCs2jDfRnMxWHToNy1gKdW/view?usp=drivesdk",
      "source": "internal",
      "zone": "zone-c"
    },
    {
      "Codes": "LLO-1025",
      "Category": "Fixture",
      "ImageLink": "https://images.unsplash.com/photo-1615873968403-89e068629265?w=600",
      "source": "internal",
      "zone": "zone-c"
    },
    {
      "Codes": "LB-247",
      "Category": "Accent",
      "ImageLink": "https://drive.google.com/file/d/1dnm4IAIFXvDd6R__3UOvPcvxEBZkVirT/view?usp=drivesdk",
      "source": "internal",
      "zone": "zone-c"
    },
    {
      "Codes": "LLO-079X",
      "Category": "Floor",
      "ImageLink": "https://images.unsplash.com/photo-1615873968403-89e068629265?w=600",
      "source": "internal",
      "zone": "zone-c"
    },
    {
      "Codes": "LSO-052",
      "Category": "Wall",
      "ImageLink": "https://drive.google.com/file/d/1IA2Gf6b2W35PHPF4UOj2gJwdZPYJhuib/view?usp=drivesdk",
      "source": "internal",
      "zone": "zone-c"
    },
    {
      "Codes": "LWO-102",
      "Category": "Floor",
      "ImageLink": "https://images.unsplash.com/photo-1615873968403-89e068629265?w=600",
      "source": "internal",
      "zone": "zone-c"
    },
    {
      "Codes": "LSO-056/LLO-159T",
      "Category": "Accent",
      "ImageLink": "https://drive.google.com/file/d/1NBjKBemCclFQNXzhTejbpxXQXKAzkjUa/view?usp=drivesdk",
      "source": "internal",
      "zone": "zone-c"
    },
    {
      "Codes": "LB-163/LLO-140",
      "Category": "Light",
      "ImageLink": "https://drive.google.com/file/d/1NIBXQW58R68n9TanPH02PzJXff7Gba67/view?usp=drivesdk",
      "source": "internal",
      "zone": "zone-c"
    },
    {
      "Codes": "LFO-010",
      "Category": "Light",
      "ImageLink": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600",
      "source": "internal",
      "zone": "zone-c"
    },
    {
      "Codes": "LSO-016",
      "Category": "Floor",
      "ImageLink": "https://drive.google.com/file/d/1obbeVwQHLmG_1a6itTDQRfOrN7VuIZLz/view?usp=drivesdk",
      "source": "internal",
      "zone": "zone-c"
    },
    {
      "Codes": "LLO-159Y/Z",
      "Category": "Ceiling",
      "ImageLink": "https://drive.google.com/file/d/1YN6XqLoScsFktxn4OOAoBMUUxi7QVaCV/view?usp=drivesdk",
      "source": "internal",
      "zone": "zone-c"
    },
    {
      "Codes": "LB-206",
      "Category": "Floor",
      "ImageLink": "https://drive.google.com/file/d/1LJgXYvMk4wrusRnGed_doz6aqKk15nww/view?usp=drivesdk",
      "source": "internal",
      "zone": "zone-c"
    },
    {
      "Codes": "LFO-009",
      "Category": "Wall",
      "ImageLink": "https://images.unsplash.com/photo-1615873968403-89e068629265?w=600",
      "source": "internal",
      "zone": "zone-c"
    },
    {
      "Codes": "LB-209-LLO-159B",
      "Category": "Wall",
      "ImageLink": "https://drive.google.com/file/d/1BqnjVcGMyZrDmHn51nlUjPiwmXbYB6Iv/view?usp=drivesdk",
      "source": "internal",
      "zone": "zone-c"
    },
    {
      "Codes": "ZONE-C2",
      "Category": "Accent",
      "ImageLink": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600",
      "source": "internal",
      "zone": "zone-c"
    },
    {
      "Codes": "LLO-1002",
      "Category": "Wall",
      "ImageLink": "https://drive.google.com/file/d/1V72O9LvRKGj55ZX78BfXSinPuzR0Sh1O/view?usp=drivesdk",
      "source": "internal",
      "zone": "zone-c"
    },
    {
      "Codes": "LWO-010",
      "Category": "Wall",
      "ImageLink": "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=600",
      "source": "internal",
      "zone": "zone-c"
    },
    {
      "Codes": "LLP-90/35",
      "Category": "Light",
      "ImageLink": "https://drive.google.com/file/d/11XVO7R8F92K3muxYYz9jtJ31i2o2rqFS/view?usp=drivesdk",
      "source": "internal",
      "zone": "zone-c"
    },
    {
      "Codes": "LLP-2",
      "Category": "Fixture",
      "ImageLink": "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=600",
      "source": "internal",
      "zone": "zone-c"
    },
    {
      "Codes": "LLP-1-5",
      "Category": "Fixture",
      "ImageLink": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600",
      "source": "internal",
      "zone": "zone-c"
    },
    {
      "Codes": "LLO-079J",
      "Category": "Floor",
      "ImageLink": "https://drive.google.com/file/d/1ekDHwDPiruMbLaAEbeR_WGLcqhIAVIOO/view?usp=drivesdk",
      "source": "internal",
      "zone": "zone-c"
    },
    {
      "Codes": "LLO-131",
      "Category": "Floor",
      "ImageLink": "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=600",
      "source": "internal",
      "zone": "zone-c"
    },
    {
      "Codes": "LL+-SVR-1-TRIX",
      "Category": "Accent",
      "ImageLink": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600",
      "source": "internal",
      "zone": "zone-c"
    },
    {
      "Codes": "LL+-SVR-TRIX-2",
      "Category": "Ceiling",
      "ImageLink": "https://images.unsplash.com/photo-1615873968403-89e068629265?w=600",
      "source": "internal",
      "zone": "zone-c"
    },
    {
      "Codes": "LLO-130",
      "Category": "Light",
      "ImageLink": "https://images.unsplash.com/photo-1615873968403-89e068629265?w=600",
      "source": "internal",
      "zone": "zone-c"
    },
    {
      "Codes": "1617 NEON-6",
      "Category": "Accent",
      "ImageLink": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600",
      "source": "internal",
      "zone": "zone-c"
    },
    {
      "Codes": "NEON-4",
      "Category": "Floor",
      "ImageLink": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600",
      "source": "internal",
      "zone": "zone-c"
    },
    {
      "Codes": "NEON-BLACK2",
      "Category": "Wall",
      "ImageLink": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600",
      "source": "internal",
      "zone": "zone-c"
    },
    {
      "Codes": "NEON8-HC",
      "Category": "Accent",
      "ImageLink": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600",
      "source": "internal",
      "zone": "zone-c"
    },
    {
      "Codes": "2020 NEON-9",
      "Category": "Light",
      "ImageLink": "https://images.unsplash.com/photo-1615873968403-89e068629265?w=600",
      "source": "internal",
      "zone": "zone-c"
    },
    {
      "Codes": "LLWW-019",
      "Category": "Floor",
      "ImageLink": "https://drive.google.com/file/d/1Vjgu3ywjHxVAcQylwHwhmuihfZyQtARu/view?usp=drivesdk",
      "source": "internal",
      "zone": "zone-c"
    },
    {
      "Codes": "LWO-007",
      "Category": "Accent",
      "ImageLink": "https://drive.google.com/file/d/17ZXgHZkQEJbR5dpiyko50UzegXHkizXw/view?usp=drivesdk",
      "source": "internal",
      "zone": "zone-c"
    },
    {
      "Codes": "LWO-009",
      "Category": "Light",
      "ImageLink": "https://drive.google.com/file/d/1USADOgu6WrpyYUQdbRtSkl20q7Pbrai7/view?usp=drivesdk",
      "source": "internal",
      "zone": "zone-c"
    },
    {
      "Codes": "LWO-003",
      "Category": "Floor",
      "ImageLink": "https://drive.google.com/file/d/12HMcgpwgHYX8j5w9zAr8eu9kpA_i7OBL/view?usp=drivesdk",
      "source": "internal",
      "zone": "zone-c"
    },
    {
      "Codes": "LWO-008",
      "Category": "Accent",
      "ImageLink": "https://drive.google.com/file/d/1M73zi7OB0j5XGtBy3kyGnZlMsyd2x8Rt/view?usp=drivesdk",
      "source": "internal",
      "zone": "zone-c"
    },
    {
      "Codes": "LWO-005",
      "Category": "Accent",
      "ImageLink": "https://drive.google.com/file/d/1NM9zFfA0aWlrn48rCM9zyRq2KfPStSYl/view?usp=drivesdk",
      "source": "internal",
      "zone": "zone-c"
    },
    {
      "Codes": "LWO-004",
      "Category": "Wall",
      "ImageLink": "https://drive.google.com/file/d/1wmvSWWjqkbHs8t04cKkQ5FAs959WrEc6/view?usp=drivesdk",
      "source": "internal",
      "zone": "zone-c"
    },
    {
      "Codes": "LWO-006",
      "Category": "Ceiling",
      "ImageLink": "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=600",
      "source": "internal",
      "zone": "zone-c"
    },
    {
      "Codes": "LB-230,235&LLO 1017,1022 GROUP",
      "Category": "Accent",
      "ImageLink": "https://drive.google.com/file/d/1yj5ccfDToasvbi4XFLvhIBk4ScH6AlpH/view?usp=drivesdk",
      "source": "internal",
      "zone": "zone-d"
    },
    {
      "Codes": "LB-159, 214 & LLO-1004 & 1005 GROUP",
      "Category": "Floor",
      "ImageLink": "https://drive.google.com/file/d/1iTlCvppcbnLOEB06pdB1viCQXHASZ2L_/view?usp=drivesdk",
      "source": "internal",
      "zone": "zone-d"
    },
    {
      "Codes": "LB-226, LLO-1014, 1015, 1016",
      "Category": "Ceiling",
      "ImageLink": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600",
      "source": "internal",
      "zone": "zone-d"
    },
    {
      "Codes": "LLO-1001,1021 & LB-233, 201 GROUP",
      "Category": "Fixture",
      "ImageLink": "https://drive.google.com/file/d/1u1nCPShASUyJwi9W3WnUW9xrNWylSjas/view?usp=drivesdk",
      "source": "internal",
      "zone": "zone-d"
    },
    {
      "Codes": "LB,164,225 & LLO-1013 & 1018 GROUP",
      "Category": "Floor",
      "ImageLink": "https://drive.google.com/file/d/10icR4BLbQGGT7SiQ1ZSI4eEvHhqivRJn/view?usp=drivesdk",
      "source": "internal",
      "zone": "zone-d"
    },
    {
      "Codes": "LB-164 & 225",
      "Category": "Light",
      "ImageLink": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600",
      "source": "internal",
      "zone": "zone-d"
    },
    {
      "Codes": "LB-230 & 235",
      "Category": "Light",
      "ImageLink": "https://drive.google.com/file/d/1yj5ccfDToasvbi4XFLvhIBk4ScH6AlpH/view?usp=drivesdk",
      "source": "internal",
      "zone": "zone-d"
    },
    {
      "Codes": "LB-234 & 200",
      "Category": "Accent",
      "ImageLink": "https://drive.google.com/file/d/15VAv36dik6sYx9NP3BdF5bxCw9nRuR9n/view?usp=drivesdk",
      "source": "internal",
      "zone": "zone-d"
    },
    {
      "Codes": "LB - 159& 214",
      "Category": "Floor",
      "ImageLink": "https://drive.google.com/file/d/1iTlCvppcbnLOEB06pdB1viCQXHASZ2L_/view?usp=drivesdk",
      "source": "internal",
      "zone": "zone-d"
    },
    {
      "Codes": "LLO-1015",
      "Category": "Floor",
      "ImageLink": "https://images.unsplash.com/photo-1615873968403-89e068629265?w=600",
      "source": "internal",
      "zone": "zone-d"
    },
    {
      "Codes": "LLO-1016",
      "Category": "Wall",
      "ImageLink": "https://drive.google.com/file/d/10mnS9aqzbSgJT9sX1buY8J6Ei_V0kX6Z/view?usp=drivesdk",
      "source": "internal",
      "zone": "zone-d"
    },
    {
      "Codes": "LLO-1005",
      "Category": "Fixture",
      "ImageLink": "https://drive.google.com/file/d/1ZuJM8povGRDC_105MkJnhH2XewPwN7hO/view?usp=drivesdk",
      "source": "internal",
      "zone": "zone-d"
    },
    {
      "Codes": "LLO-1001",
      "Category": "Light",
      "ImageLink": "https://drive.google.com/file/d/1u1nCPShASUyJwi9W3WnUW9xrNWylSjas/view?usp=drivesdk",
      "source": "internal",
      "zone": "zone-d"
    },
    {
      "Codes": "LLO-1018",
      "Category": "Accent",
      "ImageLink": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600",
      "source": "internal",
      "zone": "zone-d"
    },
    {
      "Codes": "LLO-1014",
      "Category": "Floor",
      "ImageLink": "https://drive.google.com/file/d/19zbftFIOIzgWn_WqmoMI2EeYKt42lWlx/view?usp=drivesdk",
      "source": "internal",
      "zone": "zone-d"
    },
    {
      "Codes": "LLO-1013",
      "Category": "Floor",
      "ImageLink": "https://drive.google.com/file/d/10icR4BLbQGGT7SiQ1ZSI4eEvHhqivRJn/view?usp=drivesdk",
      "source": "internal",
      "zone": "zone-d"
    },
    {
      "Codes": "LLO-1004",
      "Category": "Wall",
      "ImageLink": "https://drive.google.com/file/d/102_0WT248A_57uE4e4FLi1gjYW01wu5p/view?usp=drivesdk",
      "source": "internal",
      "zone": "zone-d"
    },
    {
      "Codes": "LLO-1020",
      "Category": "Light",
      "ImageLink": "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=600",
      "source": "internal",
      "zone": "zone-d"
    },
    {
      "Codes": "LLO-1017",
      "Category": "Accent",
      "ImageLink": "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=600",
      "source": "internal",
      "zone": "zone-d"
    },
    {
      "Codes": "LLO-079S",
      "Category": "Ceiling",
      "ImageLink": "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=600",
      "source": "internal",
      "zone": "zone-d"
    },
    {
      "Codes": "LLO-1022",
      "Category": "Floor",
      "ImageLink": "https://drive.google.com/file/d/11qwDzFmrQPQF1glXIEHtK1E5MnNGRTb9/view?usp=drivesdk",
      "source": "internal",
      "zone": "zone-d"
    },
    {
      "Codes": "LLS-084",
      "Category": "Fixture",
      "ImageLink": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600",
      "source": "internal",
      "zone": "zone-e"
    },
    {
      "Codes": "LLS-1003",
      "Category": "Light",
      "ImageLink": "https://drive.google.com/file/d/1jxCDUwqZmlb9xbTu15zyNy7TpQmBvsYu/view?usp=drivesdk",
      "source": "internal",
      "zone": "zone-e"
    },
    {
      "Codes": "LLS-068",
      "Category": "Fixture",
      "ImageLink": "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=600",
      "source": "internal",
      "zone": "zone-e"
    },
    {
      "Codes": "LLS-130",
      "Category": "Fixture",
      "ImageLink": "https://drive.google.com/file/d/1MPNLqrvpSkGm4g8FMpRgMaU8OsEE7BQJ/view?usp=drivesdk",
      "source": "internal",
      "zone": "zone-e"
    },
    {
      "Codes": "LLS-1002",
      "Category": "Fixture",
      "ImageLink": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600",
      "source": "internal",
      "zone": "zone-e"
    },
    {
      "Codes": "LLS-1001",
      "Category": "Fixture",
      "ImageLink": "https://drive.google.com/file/d/1fF2WZ0FhlvKhbYCba_QeV3mWkC34S5G_/view?usp=drivesdk",
      "source": "internal",
      "zone": "zone-e"
    },
    {
      "Codes": "LLS-125",
      "Category": "Light",
      "ImageLink": "https://drive.google.com/file/d/1mxCk69dN9XIJTdhywZUEMW60JVPh_sga/view?usp=drivesdk",
      "source": "internal",
      "zone": "zone-e"
    },
    {
      "Codes": "LLS-128",
      "Category": "Light",
      "ImageLink": "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=600",
      "source": "internal",
      "zone": "zone-e"
    },
    {
      "Codes": "LLS-046A",
      "Category": "Accent",
      "ImageLink": "https://images.unsplash.com/photo-1615873968403-89e068629265?w=600",
      "source": "internal",
      "zone": "zone-e"
    },
    {
      "Codes": "LLS-125A",
      "Category": "Light",
      "ImageLink": "https://drive.google.com/file/d/1LsGwbx1EZimX0ob_qJioTFdPJWpLCaqf/view?usp=drivesdk",
      "source": "internal",
      "zone": "zone-e"
    },
    {
      "Codes": "LLS-117",
      "Category": "Wall",
      "ImageLink": "https://images.unsplash.com/photo-1615873968403-89e068629265?w=600",
      "source": "internal",
      "zone": "zone-e"
    },
    {
      "Codes": "https://drive.google.com/file/d/1aAuaTBOt8uksExLz-XpMzj-MTl-O_Q2E/view?usp=drivesdk",
      "Category": "Light",
      "ImageLink": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600",
      "source": "internal",
      "zone": "zone-e"
    },
    {
      "Codes": "LLS-121",
      "Category": "Accent",
      "ImageLink": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600",
      "source": "internal",
      "zone": "zone-e"
    },
    {
      "Codes": "LLWW-014",
      "Category": "Fixture",
      "ImageLink": "https://drive.google.com/file/d/1U6aQHDGIC1kHoO3UOam5n6g9U8iekpfV/view?usp=drivesdk",
      "source": "internal",
      "zone": "zone-g"
    },
    {
      "Codes": "LB-125",
      "Category": "Fixture",
      "ImageLink": "https://drive.google.com/file/d/1kZbaWsGf7kF1ClxSUmbZQWis1J7ffPDx/view?usp=drivesdk",
      "source": "internal",
      "zone": "zone-g"
    },
    {
      "Codes": "LLO-144",
      "Category": "Wall",
      "ImageLink": "https://drive.google.com/file/d/12oQOgD71K2aa9zjoC1vCRo0DPNGnq4QV/view?usp=drivesdk",
      "source": "internal",
      "zone": "zone-g"
    },
    {
      "Codes": "LLO-159V",
      "Category": "Wall",
      "ImageLink": "https://drive.google.com/file/d/1T9Y_8Y1kmB2pcGJCy54bVELuOYTmN4Je/view?usp=drivesdk",
      "source": "internal",
      "zone": "zone-g"
    },
    {
      "Codes": "LB-245",
      "Category": "Floor",
      "ImageLink": "https://drive.google.com/file/d/1IxXApS5685DvZ_j2sYM4pqVJALBhcl3C/view?usp=drivesdk",
      "source": "internal",
      "zone": "zone-g"
    },
    {
      "Codes": "LB-141",
      "Category": "Fixture",
      "ImageLink": "https://drive.google.com/file/d/1OwJlLLHat0jPeyrg3PRF_eQW7dct2PBY/view?usp=drivesdk",
      "source": "internal",
      "zone": "zone-g"
    },
    {
      "Codes": "LB-072, 032",
      "Category": "Wall",
      "ImageLink": "https://drive.google.com/file/d/1F6BY7n9Jb_U6mQR4S7gfloJhYktNZrVJ/view?usp=drivesdk",
      "source": "internal",
      "zone": "zone-g"
    },
    {
      "Codes": "LLO-142",
      "Category": "Light",
      "ImageLink": "https://drive.google.com/file/d/1B2jTTCbgUqalNgjzBMbhYyEqTd5QjDnA/view?usp=drivesdk",
      "source": "internal",
      "zone": "zone-g"
    },
    {
      "Codes": "LB-138&167",
      "Category": "Floor",
      "ImageLink": "https://drive.google.com/file/d/1G6gnWEMPYcGSqGSUyvfeCRFvvT9ZhbnA/view?usp=drivesdk",
      "source": "internal",
      "zone": "zone-g"
    },
    {
      "Codes": "LFO-007",
      "Category": "Ceiling",
      "ImageLink": "https://images.unsplash.com/photo-1615873968403-89e068629265?w=600",
      "source": "internal",
      "zone": "zone-g"
    },
    {
      "Codes": "LB-203&036",
      "Category": "Floor",
      "ImageLink": "https://drive.google.com/file/d/1rwYhOkun3n8OGO_P6XenZLae96LYEzHo/view?usp=drivesdk",
      "source": "internal",
      "zone": "zone-g"
    },
    {
      "Codes": "LB-126",
      "Category": "Fixture",
      "ImageLink": "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=600",
      "source": "internal",
      "zone": "zone-g"
    },
    {
      "Codes": "LB-207",
      "Category": "Floor",
      "ImageLink": "https://images.unsplash.com/photo-1615873968403-89e068629265?w=600",
      "source": "internal",
      "zone": "eb-room"
    },
    {
      "Codes": "LLF-348-G1",
      "Category": "Light",
      "ImageLink": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600",
      "source": "internal",
      "zone": "astara-lounge"
    },
    {
      "Codes": "LLF-1062-G4",
      "Category": "Accent",
      "ImageLink": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600",
      "source": "internal",
      "zone": "astara-lounge"
    },
    {
      "Codes": "LLF-323-G1",
      "Category": "Accent",
      "ImageLink": "https://drive.google.com/file/d/1MS4K1DJDhpL0LJVyGhkbTAsSmtTHyk6Q/view?usp=drivesdk",
      "source": "internal",
      "zone": "astara-lounge"
    },
    {
      "Codes": "LLF-1061-2-G1",
      "Category": "Fixture",
      "ImageLink": "https://images.unsplash.com/photo-1615873968403-89e068629265?w=600",
      "source": "internal",
      "zone": "astara-lounge"
    },
    {
      "Codes": "LLF-239-G1",
      "Category": "Floor",
      "ImageLink": "https://drive.google.com/file/d/1QsraH7TyrStRwq0opl_yenhycYlmxhbN/view?usp=drivesdk",
      "source": "internal",
      "zone": "astara-lounge"
    },
    {
      "Codes": "LLF-320-G2",
      "Category": "Wall",
      "ImageLink": "https://drive.google.com/file/d/1idGrBLXXC_ylk3QxG7LYapcwk6f4nE2I/view?usp=drivesdk",
      "source": "internal",
      "zone": "astara-lounge"
    },
    {
      "Codes": "LLF-341-G2",
      "Category": "Floor",
      "ImageLink": "https://drive.google.com/file/d/1k4I5Obp7xzm1Rb6OclIDakyYsXmGnXcw/view?usp=drivesdk",
      "source": "internal",
      "zone": "astara-lounge"
    },
    {
      "Codes": "LLF-294A-G2",
      "Category": "Wall",
      "ImageLink": "https://images.unsplash.com/photo-1615873968403-89e068629265?w=600",
      "source": "internal",
      "zone": "astara-lounge"
    },
    {
      "Codes": "LLF-1062-G3",
      "Category": "Ceiling",
      "ImageLink": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600",
      "source": "internal",
      "zone": "astara-lounge"
    },
    {
      "Codes": "LLF-306-G3",
      "Category": "Wall",
      "ImageLink": "https://drive.google.com/file/d/1HzIATWbi0vfiD2QFy67b_VQCCbPtoJDv/view?usp=drivesdk",
      "source": "internal",
      "zone": "astara-lounge"
    },
    {
      "Codes": "LLF-1065-G3",
      "Category": "Accent",
      "ImageLink": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600",
      "source": "internal",
      "zone": "astara-lounge"
    },
    {
      "Codes": "LLF-1065-G4",
      "Category": "Light",
      "ImageLink": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600",
      "source": "internal",
      "zone": "astara-lounge"
    },
    {
      "Codes": "LLF-294A-G5",
      "Category": "Accent",
      "ImageLink": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600",
      "source": "internal",
      "zone": "astara-lounge"
    },
    {
      "Codes": "LLF-298-G5",
      "Category": "Light",
      "ImageLink": "https://images.unsplash.com/photo-1615873968403-89e068629265?w=600",
      "source": "internal",
      "zone": "astara-lounge"
    },
    {
      "Codes": "LLF-1008-G5",
      "Category": "Light",
      "ImageLink": "https://drive.google.com/file/d/107usmuPlE_dQhfbzbnfnY3JbnmnVJJ4K/view?usp=drivesdk",
      "source": "internal",
      "zone": "astara-lounge"
    },
    {
      "Codes": "LLF-320-G5",
      "Category": "Floor",
      "ImageLink": "https://drive.google.com/file/d/1idGrBLXXC_ylk3QxG7LYapcwk6f4nE2I/view?usp=drivesdk",
      "source": "internal",
      "zone": "astara-lounge"
    },
    {
      "Codes": "LLF-348-G6",
      "Category": "Ceiling",
      "ImageLink": "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=600",
      "source": "internal",
      "zone": "astara-lounge"
    },
    {
      "Codes": "LLF-239-G6",
      "Category": "Fixture",
      "ImageLink": "https://drive.google.com/file/d/1QsraH7TyrStRwq0opl_yenhycYlmxhbN/view?usp=drivesdk",
      "source": "internal",
      "zone": "astara-lounge"
    },
    {
      "Codes": "LLF-323-G6",
      "Category": "Floor",
      "ImageLink": "https://drive.google.com/file/d/1MS4K1DJDhpL0LJVyGhkbTAsSmtTHyk6Q/view?usp=drivesdk",
      "source": "internal",
      "zone": "astara-lounge"
    },
    {
      "Codes": "LLF-1061-G6",
      "Category": "Light",
      "ImageLink": "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=600",
      "source": "internal",
      "zone": "astara-lounge"
    },
    {
      "Codes": "LLF-298-G2",
      "Category": "Accent",
      "ImageLink": "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=600",
      "source": "internal",
      "zone": "astara-lounge"
    },
    {
      "Codes": "LLF-1008-G2",
      "Category": "Fixture",
      "ImageLink": "https://drive.google.com/file/d/107usmuPlE_dQhfbzbnfnY3JbnmnVJJ4K/view?usp=drivesdk",
      "source": "internal",
      "zone": "astara-lounge"
    },
    {
      "Codes": "LLF-1003-G4",
      "Category": "Wall",
      "ImageLink": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600",
      "source": "internal",
      "zone": "astara-lounge"
    },
    {
      "Codes": "LLF-306-G4",
      "Category": "Fixture",
      "ImageLink": "https://drive.google.com/file/d/1rUmC44_9lZUjZ41w1Z_8omE2X8DtbErq/view?usp=drivesdk",
      "source": "internal",
      "zone": "astara-lounge"
    },
    {
      "Codes": "LLF-1060-G3",
      "Category": "Wall",
      "ImageLink": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600",
      "source": "internal",
      "zone": "astara-lounge"
    },
    {
      "Codes": "LLF1061-1-G1",
      "Category": "Ceiling",
      "ImageLink": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600",
      "source": "internal",
      "zone": "astara-lounge"
    },
    {
      "Codes": "LLF-341-G5",
      "Category": "Floor",
      "ImageLink": "https://drive.google.com/file/d/1TJqjzgyxmEevlJ378ZcsywbSlny8xNIT/view?usp=drivesdk",
      "source": "internal",
      "zone": "astara-lounge"
    },
    {
      "Codes": "LLF-1003-G3",
      "Category": "Floor",
      "ImageLink": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600",
      "source": "internal",
      "zone": "astara-lounge"
    },
    {
      "Codes": "LLA-058",
      "Category": "Fixture",
      "ImageLink": "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=600",
      "source": "internal",
      "zone": "artizan"
    },
    {
      "Codes": "ARL-3301",
      "Category": "Light",
      "ImageLink": "https://images.unsplash.com/photo-1615873968403-89e068629265?w=600",
      "source": "internal",
      "zone": "artizan"
    },
    {
      "Codes": "LLA-121",
      "Category": "Fixture",
      "ImageLink": "https://drive.google.com/file/d/10Cn3GB4LlY5B3QKQ5PADGb1H4e8Drhj7/view?usp=drivesdk",
      "source": "internal",
      "zone": "artizan"
    },
    {
      "Codes": "ARL-3302",
      "Category": "Floor",
      "ImageLink": "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=600",
      "source": "internal",
      "zone": "artizan"
    },
    {
      "Codes": "LLA-082 GROUP",
      "Category": "Light",
      "ImageLink": "https://drive.google.com/file/d/1YVp98KS7_fycCvwGB4yJiHGB2Cj5Q6iM/view?usp=drivesdk",
      "source": "internal",
      "zone": "artizan"
    },
    {
      "Codes": "LLA-062 GROUP",
      "Category": "Light",
      "ImageLink": "https://drive.google.com/file/d/1YfAgruwX7JhAuocvZptn_QLAcHoN8LvT/view?usp=drivesdk",
      "source": "internal",
      "zone": "artizan"
    },
    {
      "Codes": "LLA-058 GROUP",
      "Category": "Ceiling",
      "ImageLink": "https://images.unsplash.com/photo-1615873968403-89e068629265?w=600",
      "source": "internal",
      "zone": "artizan"
    },
    {
      "Codes": "LLA-122 GROUP",
      "Category": "Light",
      "ImageLink": "https://images.unsplash.com/photo-1615873968403-89e068629265?w=600",
      "source": "internal",
      "zone": "artizan"
    },
    {
      "Codes": "LLA-004 GROUP",
      "Category": "Accent",
      "ImageLink": "https://drive.google.com/file/d/1hhtiQD8hyoc4vd2MEIDs0BwAP41h8ctW/view?usp=drivesdk",
      "source": "internal",
      "zone": "artizan"
    },
    {
      "Codes": "https://drive.google.com/file/d/1HuPDhLz3QgYUlfhY-gEH4kO4J5WvgsGa/view?usp=drivesdk",
      "Category": "Wall",
      "ImageLink": "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=600",
      "source": "internal",
      "zone": "artizan"
    },
    {
      "Codes": "ARL3302 WALL WASHER - GROUP",
      "Category": "Wall",
      "ImageLink": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600",
      "source": "internal",
      "zone": "artizan"
    },
    {
      "Codes": "LLA-061 GROUP",
      "Category": "Light",
      "ImageLink": "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=600",
      "source": "internal",
      "zone": "artizan"
    },
    {
      "Codes": "LLA-071 GROUP",
      "Category": "Accent",
      "ImageLink": "https://drive.google.com/file/d/1ebyhjZ0pgClKcnpXnrwlv1awX_IhWI_z/view?usp=drivesdk",
      "source": "internal",
      "zone": "artizan"
    },
    {
      "Codes": "LLA-056 GROUP",
      "Category": "Wall",
      "ImageLink": "https://drive.google.com/file/d/1s5qHpC1D7Y1xw26J943PfUAhiyL4dGbz/view?usp=drivesdk",
      "source": "internal",
      "zone": "artizan"
    },
    {
      "Codes": "LLA-073 GROUP",
      "Category": "Light",
      "ImageLink": "https://images.unsplash.com/photo-1615873968403-89e068629265?w=600",
      "source": "internal",
      "zone": "artizan"
    },
    {
      "Codes": "LLA-081-GB GROUP",
      "Category": "Light",
      "ImageLink": "https://drive.google.com/file/d/10umspV1tzT7PnpyUo9dvYhx2XQr9LKd_/view?usp=drivesdk",
      "source": "internal",
      "zone": "artizan"
    },
    {
      "Codes": "LLA-114-G6 GROUP",
      "Category": "Light",
      "ImageLink": "https://images.unsplash.com/photo-1615873968403-89e068629265?w=600",
      "source": "internal",
      "zone": "artizan"
    },
    {
      "Codes": "LLA-114-G6",
      "Category": "Floor",
      "ImageLink": "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=600",
      "source": "internal",
      "zone": "artizan"
    },
    {
      "Codes": "LLA-056-G10",
      "Category": "Ceiling",
      "ImageLink": "https://drive.google.com/file/d/1s5qHpC1D7Y1xw26J943PfUAhiyL4dGbz/view?usp=drivesdk",
      "source": "internal",
      "zone": "artizan"
    },
    {
      "Codes": "LLA-082-G2",
      "Category": "Accent",
      "ImageLink": "https://drive.google.com/file/d/1YVp98KS7_fycCvwGB4yJiHGB2Cj5Q6iM/view?usp=drivesdk",
      "source": "internal",
      "zone": "artizan"
    },
    {
      "Codes": "LLA-062-G2",
      "Category": "Floor",
      "ImageLink": "https://drive.google.com/file/d/1YfAgruwX7JhAuocvZptn_QLAcHoN8LvT/view?usp=drivesdk",
      "source": "internal",
      "zone": "artizan"
    },
    {
      "Codes": "LLA-122-G4",
      "Category": "Accent",
      "ImageLink": "https://drive.google.com/file/d/1Nbyb_aTXFPQeI4NqUfhm7HxfaKAYgBta/view?usp=drivesdk",
      "source": "internal",
      "zone": "artizan"
    },
    {
      "Codes": "LLA-061-G3",
      "Category": "Fixture",
      "ImageLink": "https://images.unsplash.com/photo-1615873968403-89e068629265?w=600",
      "source": "internal",
      "zone": "artizan"
    },
    {
      "Codes": "LLA-073-G11",
      "Category": "Floor",
      "ImageLink": "https://images.unsplash.com/photo-1615873968403-89e068629265?w=600",
      "source": "internal",
      "zone": "artizan"
    },
    {
      "Codes": "LLA-073-G4",
      "Category": "Fixture",
      "ImageLink": "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=600",
      "source": "internal",
      "zone": "artizan"
    },
    {
      "Codes": "ARL3302 WALL WASHER - G12",
      "Category": "Floor",
      "ImageLink": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600",
      "source": "internal",
      "zone": "artizan"
    },
    {
      "Codes": "LLA-062-G4",
      "Category": "Wall",
      "ImageLink": "https://drive.google.com/file/d/1YfAgruwX7JhAuocvZptn_QLAcHoN8LvT/view?usp=drivesdk",
      "source": "internal",
      "zone": "artizan"
    },
    {
      "Codes": "LLA-122-G9",
      "Category": "Wall",
      "ImageLink": "https://drive.google.com/file/d/1Nbyb_aTXFPQeI4NqUfhm7HxfaKAYgBta/view?usp=drivesdk",
      "source": "internal",
      "zone": "artizan"
    },
    {
      "Codes": "LLA-004-G2",
      "Category": "Wall",
      "ImageLink": "https://drive.google.com/file/d/1hhtiQD8hyoc4vd2MEIDs0BwAP41h8ctW/view?usp=drivesdk",
      "source": "internal",
      "zone": "artizan"
    },
    {
      "Codes": "LLA-073-G2",
      "Category": "Wall",
      "ImageLink": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600",
      "source": "internal",
      "zone": "artizan"
    },
    {
      "Codes": "ARL3302 WALL WASHER - G1",
      "Category": "Floor",
      "ImageLink": "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=600",
      "source": "internal",
      "zone": "artizan"
    },
    {
      "Codes": "LLA-004-G11",
      "Category": "Floor",
      "ImageLink": "https://drive.google.com/file/d/1hhtiQD8hyoc4vd2MEIDs0BwAP41h8ctW/view?usp=drivesdk",
      "source": "internal",
      "zone": "artizan"
    },
    {
      "Codes": "LLA-081-G8",
      "Category": "Accent",
      "ImageLink": "https://drive.google.com/file/d/10umspV1tzT7PnpyUo9dvYhx2XQr9LKd_/view?usp=drivesdk",
      "source": "internal",
      "zone": "artizan"
    },
    {
      "Codes": "LLA-082-G11",
      "Category": "Floor",
      "ImageLink": "https://drive.google.com/file/d/1YVp98KS7_fycCvwGB4yJiHGB2Cj5Q6iM/view?usp=drivesdk",
      "source": "internal",
      "zone": "artizan"
    },
    {
      "Codes": "LLA-062-G9",
      "Category": "Fixture",
      "ImageLink": "https://drive.google.com/file/d/1YfAgruwX7JhAuocvZptn_QLAcHoN8LvT/view?usp=drivesdk",
      "source": "internal",
      "zone": "artizan"
    },
    {
      "Codes": "LLA-061-G10",
      "Category": "Ceiling",
      "ImageLink": "https://images.unsplash.com/photo-1615873968403-89e068629265?w=600",
      "source": "internal",
      "zone": "artizan"
    },
    {
      "Codes": "LLA-062-G11",
      "Category": "Wall",
      "ImageLink": "https://drive.google.com/file/d/1YfAgruwX7JhAuocvZptn_QLAcHoN8LvT/view?usp=drivesdk",
      "source": "internal",
      "zone": "artizan"
    },
    {
      "Codes": "LLA-056-G3",
      "Category": "Accent",
      "ImageLink": "https://drive.google.com/file/d/1s5qHpC1D7Y1xw26J943PfUAhiyL4dGbz/view?usp=drivesdk",
      "source": "internal",
      "zone": "artizan"
    },
    {
      "Codes": "LLA-071-G8",
      "Category": "Fixture",
      "ImageLink": "https://drive.google.com/file/d/1ebyhjZ0pgClKcnpXnrwlv1awX_IhWI_z/view?usp=drivesdk",
      "source": "internal",
      "zone": "artizan"
    },
    {
      "Codes": "LLA-073-G9",
      "Category": "Fixture",
      "ImageLink": "https://drive.google.com/file/d/1ebyhjZ0pgClKcnpXnrwlv1awX_IhWI_z/view?usp=drivesdk",
      "source": "internal",
      "zone": "artizan"
    },
    {
      "Codes": "LLA-082-G4",
      "Category": "Light",
      "ImageLink": "https://drive.google.com/file/d/1YVp98KS7_fycCvwGB4yJiHGB2Cj5Q6iM/view?usp=drivesdk",
      "source": "internal",
      "zone": "artizan"
    },
    {
      "Codes": "LLA-082-G9",
      "Category": "Fixture",
      "ImageLink": "https://drive.google.com/file/d/1YVp98KS7_fycCvwGB4yJiHGB2Cj5Q6iM/view?usp=drivesdk",
      "source": "internal",
      "zone": "artizan"
    },
    {
      "Codes": "LLA-081-G5",
      "Category": "Accent",
      "ImageLink": "https://drive.google.com/file/d/10umspV1tzT7PnpyUo9dvYhx2XQr9LKd_/view?usp=drivesdk",
      "source": "internal",
      "zone": "artizan"
    },
    {
      "Codes": "LLA-071-G5",
      "Category": "Ceiling",
      "ImageLink": "https://drive.google.com/file/d/1ebyhjZ0pgClKcnpXnrwlv1awX_IhWI_z/view?usp=drivesdk",
      "source": "internal",
      "zone": "artizan"
    },
    {
      "Codes": "LLA-058 G2",
      "Category": "Light",
      "ImageLink": "https://images.unsplash.com/photo-1615873968403-89e068629265?w=600",
      "source": "internal",
      "zone": "artizan"
    },
    {
      "Codes": "LLA-058-G3",
      "Category": "Fixture",
      "ImageLink": "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=600",
      "source": "internal",
      "zone": "artizan"
    },
    {
      "Codes": "LLA-058-G4",
      "Category": "Wall",
      "ImageLink": "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=600",
      "source": "internal",
      "zone": "artizan"
    },
    {
      "Codes": "LLA-101-WALL WASHER-ARTIZEN",
      "Category": "Fixture",
      "ImageLink": "https://drive.google.com/file/d/17jfYQ2UjTL7UFc4vnDHvtktrw9V9oYHX/view?usp=drivesdk",
      "source": "internal",
      "zone": "artizan"
    },
    {
      "Codes": "LLF-288",
      "Category": "Light",
      "ImageLink": "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=600",
      "source": "internal",
      "zone": "conference"
    },
    {
      "Codes": "LLF-1020",
      "Category": "Ceiling",
      "ImageLink": "https://drive.google.com/file/d/1wc5m5FG_wyuV9IGnrUJqR1gT_3ThVMvH/view?usp=drivesdk",
      "source": "internal",
      "zone": "conference"
    },
    {
      "Codes": "ARL-3302",
      "Category": "Light",
      "ImageLink": "https://images.unsplash.com/photo-1615873968403-89e068629265?w=600",
      "source": "internal",
      "zone": "sumeet"
    },
    {
      "Codes": "LLA-121H",
      "Category": "Wall",
      "ImageLink": "https://drive.google.com/file/d/10Cn3GB4LlY5B3QKQ5PADGb1H4e8Drhj7/view?usp=drivesdk",
      "source": "internal",
      "zone": "abheek"
    },
    {
      "Codes": "LLA-014",
      "Category": "Ceiling",
      "ImageLink": "https://drive.google.com/file/d/1swNR5UtWe1eviMEYfetpUHQKjp8fahyM/view?usp=drivesdk",
      "source": "internal",
      "zone": "pooja"
    },
    {
      "Codes": "LLA-015",
      "Category": "Accent",
      "ImageLink": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600",
      "source": "internal",
      "zone": "pooja"
    },
    {
      "Codes": "LLA-014-TW-2",
      "Category": "Ceiling",
      "ImageLink": "https://drive.google.com/file/d/1swNR5UtWe1eviMEYfetpUHQKjp8fahyM/view?usp=drivesdk",
      "source": "internal",
      "zone": "pooja"
    },
    {
      "Codes": "LB-117",
      "Category": "Light",
      "ImageLink": "https://images.unsplash.com/photo-1615873968403-89e068629265?w=600",
      "source": "internal",
      "zone": "podcast"
    },
    {
      "Codes": "mesh CCT - 39",
      "Category": "Light",
      "ImageLink": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600",
      "source": "internal",
      "zone": "podcast"
    },
    {
      "Codes": "mesh CCT - 38",
      "Category": "Wall",
      "ImageLink": "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=600",
      "source": "internal",
      "zone": "podcast"
    },
    {
      "Codes": "mesh CCT - 163",
      "Category": "Ceiling",
      "ImageLink": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600",
      "source": "internal",
      "zone": "podcast"
    },
    {
      "Codes": "mesh CCT - 164",
      "Category": "Accent",
      "ImageLink": "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=600",
      "source": "internal",
      "zone": "podcast"
    },
    {
      "Codes": "mesh CCT - 165",
      "Category": "Light",
      "ImageLink": "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=600",
      "source": "internal",
      "zone": "podcast"
    },
    {
      "Codes": "mesh CCT - 166",
      "Category": "Wall",
      "ImageLink": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600",
      "source": "internal",
      "zone": "podcast"
    },
    {
      "Codes": "mesh CCT - 167",
      "Category": "Wall",
      "ImageLink": "https://images.unsplash.com/photo-1615873968403-89e068629265?w=600",
      "source": "internal",
      "zone": "podcast"
    },
    {
      "Codes": "mesh CCT - 168",
      "Category": "Light",
      "ImageLink": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600",
      "source": "internal",
      "zone": "podcast"
    },
    {
      "Codes": "ARL-3301",
      "Category": "Fixture",
      "ImageLink": "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=600",
      "source": "internal",
      "zone": "abhav"
    }
  ]

const globalStore = globalThis as typeof globalThis & { __products?: Product[] }
if (!globalStore.__products) globalStore.__products = []

// Merge any new SEED entries that aren't already in the store (picked up on hot reload)
const existingKeys = new Set(globalStore.__products.map(p => `${p.Codes}:${p.zone}`))
const newFromSeed = SEED
  .filter(p => !existingKeys.has(`${p.Codes}:${p.zone}`))
  .map(p => ({ ...p, id: uuidv4(), createdAt: new Date().toISOString(), updatedAt: null }))
if (newFromSeed.length) globalStore.__products.push(...newFromSeed)

export const db = {
  getAll(filters?: { search?: string; category?: string; source?: string; zone?: string }) {
    let products = [...globalStore.__products!]
    if (filters?.zone)     products = products.filter(p => p.zone === filters.zone)
    if (filters?.search) {
      const q = filters.search.toLowerCase()
      products = products.filter(p => p.Codes.toLowerCase().includes(q) || p.Category.toLowerCase().includes(q))
    }
    if (filters?.category) products = products.filter(p => p.Category === filters.category)
    if (filters?.source)   products = products.filter(p => p.source === filters.source)
    return products
  },
  getById(id: string) {
    return globalStore.__products!.find(p => p.id === id) ?? null
  },
  create(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) {
    const product: Product = { ...data, id: uuidv4(), createdAt: new Date().toISOString(), updatedAt: null }
    globalStore.__products!.unshift(product)
    return product
  },
  update(id: string, data: Partial<Product>) {
    const idx = globalStore.__products!.findIndex(p => p.id === id)
    if (idx === -1) return null
    globalStore.__products![idx] = { ...globalStore.__products![idx], ...data, id, updatedAt: new Date().toISOString() }
    return globalStore.__products![idx]
  },
  delete(id: string) {
    const idx = globalStore.__products!.findIndex(p => p.id === id)
    if (idx === -1) return false
    globalStore.__products!.splice(idx, 1)
    return true
  },
  syncExternal(records: Partial<Product>[], zone?: string) {
    let added = 0, updated = 0
    for (const raw of records) {
      const code = raw.Codes || ''
      const existing = globalStore.__products!.find(p => p.Codes === code && p.zone === (zone || raw.zone))
      if (existing) {
        db.update(existing.id, { ...raw, source: 'external' })
        updated++
      } else {
        db.create({ Codes: code, Category: raw.Category || 'Uncategorized', ImageLink: raw.ImageLink || '', source: 'external', zone: zone || raw.zone || 'zone-a' })
        added++
      }
    }
    return { added, updated }
  },
  getStats(zone?: string) {
    const products = zone ? globalStore.__products!.filter(p => p.zone === zone) : globalStore.__products!
    return {
      total:        products.length,
      withImage:    products.filter(p => p.ImageLink && p.ImageLink.length > 2).length,
      withoutImage: products.filter(p => !p.ImageLink || p.ImageLink.length <= 2).length,
      byCategory:   products.reduce((acc, p) => { acc[p.Category] = (acc[p.Category] || 0) + 1; return acc }, {} as Record<string, number>),
      bySource:     products.reduce((acc, p) => { acc[p.source]   = (acc[p.source]   || 0) + 1; return acc }, {} as Record<string, number>),
    }
  },
  getCategories(zone?: string) {
    const products = zone ? globalStore.__products!.filter(p => p.zone === zone) : globalStore.__products!
    return Array.from(new Set(products.map(p => p.Category)))
  },
}
