-- Seed sample data for augustoperezf@gmail.com
-- Run this in the Supabase SQL editor (as project owner).
-- It is safe to run multiple times — it creates fresh UUIDs each time,
-- so you will get duplicate establishments if you run it twice.

DO $$
DECLARE
  v_user_id uuid;
  v_est1    uuid := gen_random_uuid();
  v_est2    uuid := gen_random_uuid();
  v_lot1    uuid := gen_random_uuid();
  v_lot2    uuid := gen_random_uuid();
  v_lot3    uuid := gen_random_uuid();
  v_lot4    uuid := gen_random_uuid();
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'augustoperezf@gmail.com';
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found: augustoperezf@gmail.com';
  END IF;

  -- ── Establishments ─────────────────────────────────────────────────────────
  INSERT INTO public.establishments (id, user_id, name, owner, province, province_id, district, district_id)
  VALUES
    (v_est1, v_user_id, 'La Esperanza', 'Propietario Demo', 'Buenos Aires', NULL,  'Tandil',  NULL),
    (v_est2, v_user_id, 'La Alegria',   'Ferrando Juan',    'Buenos Aires', '06', 'Balcarce', '06063');

  -- ── Lots ───────────────────────────────────────────────────────────────────
  INSERT INTO public.lots (id, user_id, establishment_id, name, category, head_count)
  VALUES
    (v_lot1, v_user_id, v_est1, 'Rodeo 1',       'recriaMachos',       45),
    (v_lot2, v_user_id, v_est1, 'Recría Hembras', 'recriaHembras',      38),
    (v_lot3, v_user_id, v_est1, 'Terneros 2024',  'ternerosDestetados', 60),
    (v_lot4, v_user_id, v_est2, 'Rodeo 1 Machos', 'recriaMachos',       NULL);

  -- ── HPG records ────────────────────────────────────────────────────────────
  INSERT INTO public.hpg_records (lot_id, month_key, rows, notes) VALUES

    -- Rodeo 1
    (v_lot1,'2024-04','[{"tagId":"1","weightKg":189,"hpg":71},{"tagId":"2","weightKg":160,"hpg":111},{"tagId":"3","weightKg":172,"hpg":79},{"tagId":"4","weightKg":171,"hpg":71},{"tagId":"5","weightKg":169,"hpg":79},{"tagId":"6","weightKg":206,"hpg":93}]',''),
    (v_lot1,'2024-05','[{"tagId":"1","weightKg":163,"hpg":158},{"tagId":"2","weightKg":163,"hpg":164},{"tagId":"3","weightKg":164,"hpg":149},{"tagId":"4","weightKg":164,"hpg":174},{"tagId":"5","weightKg":196,"hpg":111},{"tagId":"6","weightKg":172,"hpg":117}]',''),
    (v_lot1,'2024-06','[{"tagId":"1","weightKg":191,"hpg":0},{"tagId":"2","weightKg":189,"hpg":0},{"tagId":"3","weightKg":175,"hpg":0},{"tagId":"4","weightKg":165,"hpg":0},{"tagId":"5","weightKg":149,"hpg":0},{"tagId":"6","weightKg":190,"hpg":0}]',''),
    (v_lot1,'2024-07','[{"tagId":"1","weightKg":207,"hpg":57},{"tagId":"2","weightKg":180,"hpg":59},{"tagId":"3","weightKg":195,"hpg":54},{"tagId":"4","weightKg":200,"hpg":60},{"tagId":"5","weightKg":160,"hpg":40},{"tagId":"6","weightKg":169,"hpg":50}]',''),
    (v_lot1,'2024-08','[{"tagId":"1","weightKg":204,"hpg":281},{"tagId":"2","weightKg":170,"hpg":269},{"tagId":"3","weightKg":192,"hpg":332},{"tagId":"4","weightKg":171,"hpg":232},{"tagId":"5","weightKg":203,"hpg":343},{"tagId":"6","weightKg":159,"hpg":296}]',''),
    (v_lot1,'2024-09','[{"tagId":"1","weightKg":181,"hpg":0},{"tagId":"2","weightKg":208,"hpg":0},{"tagId":"3","weightKg":156,"hpg":0},{"tagId":"4","weightKg":190,"hpg":0},{"tagId":"5","weightKg":181,"hpg":0},{"tagId":"6","weightKg":180,"hpg":0}]',''),
    (v_lot1,'2026-04','[]',''),

    -- Recría Hembras
    (v_lot2,'2024-04','[{"tagId":"1","weightKg":189,"hpg":0},{"tagId":"2","weightKg":155,"hpg":0},{"tagId":"3","weightKg":176,"hpg":0},{"tagId":"4","weightKg":151,"hpg":0},{"tagId":"5","weightKg":201,"hpg":0},{"tagId":"6","weightKg":184,"hpg":0}]',''),
    (v_lot2,'2024-05','[{"tagId":"1","weightKg":167,"hpg":137},{"tagId":"2","weightKg":155,"hpg":149},{"tagId":"3","weightKg":190,"hpg":133},{"tagId":"4","weightKg":151,"hpg":103},{"tagId":"5","weightKg":158,"hpg":101},{"tagId":"6","weightKg":169,"hpg":111}]',''),
    (v_lot2,'2024-06','[{"tagId":"1","weightKg":186,"hpg":0},{"tagId":"2","weightKg":149,"hpg":0},{"tagId":"3","weightKg":173,"hpg":0},{"tagId":"4","weightKg":167,"hpg":0},{"tagId":"5","weightKg":194,"hpg":0},{"tagId":"6","weightKg":180,"hpg":0}]',''),
    (v_lot2,'2024-07','[{"tagId":"1","weightKg":164,"hpg":223},{"tagId":"2","weightKg":184,"hpg":211},{"tagId":"3","weightKg":152,"hpg":181},{"tagId":"4","weightKg":190,"hpg":213},{"tagId":"5","weightKg":180,"hpg":287},{"tagId":"6","weightKg":165,"hpg":272}]',''),
    (v_lot2,'2024-08','[{"tagId":"1","weightKg":180,"hpg":439},{"tagId":"2","weightKg":154,"hpg":430},{"tagId":"3","weightKg":155,"hpg":379},{"tagId":"4","weightKg":206,"hpg":611},{"tagId":"5","weightKg":175,"hpg":552},{"tagId":"6","weightKg":153,"hpg":414}]',''),
    (v_lot2,'2024-09','[{"tagId":"1","weightKg":159,"hpg":82},{"tagId":"2","weightKg":198,"hpg":74},{"tagId":"3","weightKg":179,"hpg":112},{"tagId":"4","weightKg":192,"hpg":118},{"tagId":"5","weightKg":173,"hpg":108},{"tagId":"6","weightKg":155,"hpg":102}]',''),

    -- Terneros 2024
    (v_lot3,'2024-04','[{"tagId":"1","weightKg":191,"hpg":6},{"tagId":"2","weightKg":196,"hpg":5},{"tagId":"3","weightKg":207,"hpg":6},{"tagId":"4","weightKg":199,"hpg":4},{"tagId":"5","weightKg":206,"hpg":4},{"tagId":"6","weightKg":182,"hpg":5}]',''),
    (v_lot3,'2024-05','[{"tagId":"1","weightKg":186,"hpg":83},{"tagId":"2","weightKg":207,"hpg":88},{"tagId":"3","weightKg":155,"hpg":92},{"tagId":"4","weightKg":166,"hpg":70},{"tagId":"5","weightKg":180,"hpg":82},{"tagId":"6","weightKg":190,"hpg":75}]',''),
    (v_lot3,'2024-06','[{"tagId":"1","weightKg":178,"hpg":93},{"tagId":"2","weightKg":208,"hpg":76},{"tagId":"3","weightKg":156,"hpg":86},{"tagId":"4","weightKg":164,"hpg":70},{"tagId":"5","weightKg":161,"hpg":80},{"tagId":"6","weightKg":199,"hpg":86}]',''),
    (v_lot3,'2024-07','[{"tagId":"1","weightKg":161,"hpg":264},{"tagId":"2","weightKg":196,"hpg":318},{"tagId":"3","weightKg":166,"hpg":309},{"tagId":"4","weightKg":175,"hpg":270},{"tagId":"5","weightKg":205,"hpg":229},{"tagId":"6","weightKg":195,"hpg":234}]',''),
    (v_lot3,'2024-08','[{"tagId":"1","weightKg":156,"hpg":396},{"tagId":"2","weightKg":178,"hpg":395},{"tagId":"3","weightKg":188,"hpg":390},{"tagId":"4","weightKg":179,"hpg":414},{"tagId":"5","weightKg":152,"hpg":311},{"tagId":"6","weightKg":199,"hpg":340}]',''),
    (v_lot3,'2024-09','[{"tagId":"1","weightKg":162,"hpg":1115},{"tagId":"2","weightKg":194,"hpg":1047},{"tagId":"3","weightKg":193,"hpg":1065},{"tagId":"4","weightKg":187,"hpg":837},{"tagId":"5","weightKg":159,"hpg":964},{"tagId":"6","weightKg":192,"hpg":1105}]',''),

    -- Rodeo 1 Machos
    (v_lot4,'2026-04','[{"tagId":"01","weightKg":205,"hpg":0},{"tagId":"05","weightKg":199,"hpg":0},{"tagId":"06","weightKg":203,"hpg":50},{"tagId":"07","weightKg":210,"hpg":250},{"tagId":"03","weightKg":215,"hpg":500},{"tagId":"10","weightKg":220,"hpg":850},{"tagId":"15","weightKg":210,"hpg":100},{"tagId":"21","weightKg":200,"hpg":50},{"tagId":"59","weightKg":189,"hpg":0},{"tagId":"43","weightKg":175,"hpg":0}]','Primer muestreo HPG, sin desparacitada previa.'),
    (v_lot4,'2026-05','[{"tagId":"03","weightKg":null,"hpg":100},{"tagId":"","weightKg":null,"hpg":0},{"tagId":"","weightKg":null,"hpg":100},{"tagId":"","weightKg":null,"hpg":50},{"tagId":"","weightKg":null,"hpg":100},{"tagId":"","weightKg":null,"hpg":0},{"tagId":"","weightKg":null,"hpg":0},{"tagId":"","weightKg":null,"hpg":20},{"tagId":"","weightKg":null,"hpg":0},{"tagId":"","weightKg":null,"hpg":0}]','');

  -- ── Treatments ─────────────────────────────────────────────────────────────
  INSERT INTO public.treatments (lot_id, month_key, data) VALUES
    (v_lot1,'2024-06','{"date":"2024-06-15","drug":"Ivermectina","brand":"Ivomec","route":"Subcutánea","dose":"1ml/50kg","weight":"224","criterion":"El más pesado del lote","bcs":"3 — Moderado","ectoparasites":"none","ectoType":"","diarrhea":"none","notes":"Tratamiento preventivo estacional"}'),
    (v_lot2,'2024-06','{"date":"2024-06-15","drug":"Ivermectina","brand":"Ivomec","route":"Subcutánea","dose":"1ml/50kg","weight":"194","criterion":"El más pesado del lote","bcs":"3 — Moderado","ectoparasites":"none","ectoType":"","diarrhea":"none","notes":"Tratamiento preventivo estacional"}'),
    (v_lot3,'2024-06','{"date":"2024-06-15","drug":"Ivermectina","brand":"Ivomec","route":"Subcutánea","dose":"1ml/50kg","weight":"174","criterion":"El más pesado del lote","bcs":"3 — Moderado","ectoparasites":"none","ectoType":"","diarrhea":"none","notes":"Tratamiento preventivo estacional"}'),
    (v_lot4,'2026-04','{"date":"2026-04-22","drug":"Ricobendazol","brand":"Ricomax","route":"Subcutánea","dose":"1ml/40Kgs","weight":"210","criterion":"El más pesado del lote","bcs":"4 — Bueno","ectoparasites":"mild","ectoType":"piojos","diarrhea":"none","notes":"Lamidos"}'),
    (v_lot4,'2026-05','{"date":"2026-05-20","drug":"Ivermectina","brand":"IVOMEC","route":"Subcutánea","dose":"1ml / 50Kgs PV","weight":"220","criterion":"El más pesado del lote","bcs":"4 — Bueno","ectoparasites":"mild","ectoType":"PIOJO","diarrhea":"none","notes":"El mes anterior se hizo HPG y se desparacito con Ricobendazole mas alla del resultado del HPG por prevencion y por dtt. Este mes se observa HPG bajo, pero prescencia de lamido por esctoparasitos (PIOJO), por eso se decide administras Ivermectina al 1%."}');

  -- ── Weight records ─────────────────────────────────────────────────────────
  INSERT INTO public.weight_records (lot_id, month_key, rows, notes) VALUES

    -- Rodeo 1
    (v_lot1,'2024-04','[{"tagId":"1","weightKg":213},{"tagId":"2","weightKg":212},{"tagId":"3","weightKg":210},{"tagId":"4","weightKg":207},{"tagId":"5","weightKg":206},{"tagId":"6","weightKg":209}]',''),
    (v_lot1,'2024-05','[{"tagId":"1","weightKg":220},{"tagId":"2","weightKg":217},{"tagId":"3","weightKg":218},{"tagId":"4","weightKg":213},{"tagId":"5","weightKg":216},{"tagId":"6","weightKg":216}]',''),
    (v_lot1,'2024-06','[{"tagId":"1","weightKg":226},{"tagId":"2","weightKg":225},{"tagId":"3","weightKg":223},{"tagId":"4","weightKg":220},{"tagId":"5","weightKg":224},{"tagId":"6","weightKg":223}]',''),
    (v_lot1,'2024-07','[{"tagId":"1","weightKg":232},{"tagId":"2","weightKg":228},{"tagId":"3","weightKg":232},{"tagId":"4","weightKg":233},{"tagId":"5","weightKg":232},{"tagId":"6","weightKg":228}]',''),
    (v_lot1,'2024-08','[{"tagId":"1","weightKg":238},{"tagId":"2","weightKg":241},{"tagId":"3","weightKg":233},{"tagId":"4","weightKg":237},{"tagId":"5","weightKg":234},{"tagId":"6","weightKg":234}]',''),
    (v_lot1,'2024-09','[{"tagId":"1","weightKg":242},{"tagId":"2","weightKg":245},{"tagId":"3","weightKg":240},{"tagId":"4","weightKg":240},{"tagId":"5","weightKg":244},{"tagId":"6","weightKg":239}]',''),

    -- Recría Hembras
    (v_lot2,'2024-04','[{"tagId":"1","weightKg":183},{"tagId":"2","weightKg":181},{"tagId":"3","weightKg":181},{"tagId":"4","weightKg":179},{"tagId":"5","weightKg":184},{"tagId":"6","weightKg":182}]',''),
    (v_lot2,'2024-05','[{"tagId":"1","weightKg":188},{"tagId":"2","weightKg":186},{"tagId":"3","weightKg":184},{"tagId":"4","weightKg":189},{"tagId":"5","weightKg":190},{"tagId":"6","weightKg":191}]',''),
    (v_lot2,'2024-06','[{"tagId":"1","weightKg":193},{"tagId":"2","weightKg":193},{"tagId":"3","weightKg":195},{"tagId":"4","weightKg":191},{"tagId":"5","weightKg":190},{"tagId":"6","weightKg":198}]',''),
    (v_lot2,'2024-07','[{"tagId":"1","weightKg":197},{"tagId":"2","weightKg":202},{"tagId":"3","weightKg":198},{"tagId":"4","weightKg":199},{"tagId":"5","weightKg":201},{"tagId":"6","weightKg":198}]',''),
    (v_lot2,'2024-08','[{"tagId":"1","weightKg":205},{"tagId":"2","weightKg":209},{"tagId":"3","weightKg":205},{"tagId":"4","weightKg":205},{"tagId":"5","weightKg":210},{"tagId":"6","weightKg":206}]',''),
    (v_lot2,'2024-09','[{"tagId":"1","weightKg":214},{"tagId":"2","weightKg":213},{"tagId":"3","weightKg":213},{"tagId":"4","weightKg":216},{"tagId":"5","weightKg":209},{"tagId":"6","weightKg":217}]',''),

    -- Terneros 2024
    (v_lot3,'2024-04','[{"tagId":"1","weightKg":155},{"tagId":"2","weightKg":155},{"tagId":"3","weightKg":154},{"tagId":"4","weightKg":154},{"tagId":"5","weightKg":160},{"tagId":"6","weightKg":159}]',''),
    (v_lot3,'2024-05','[{"tagId":"1","weightKg":169},{"tagId":"2","weightKg":166},{"tagId":"3","weightKg":169},{"tagId":"4","weightKg":166},{"tagId":"5","weightKg":168},{"tagId":"6","weightKg":163}]',''),
    (v_lot3,'2024-06','[{"tagId":"1","weightKg":176},{"tagId":"2","weightKg":172},{"tagId":"3","weightKg":178},{"tagId":"4","weightKg":174},{"tagId":"5","weightKg":173},{"tagId":"6","weightKg":176}]',''),
    (v_lot3,'2024-07','[{"tagId":"1","weightKg":184},{"tagId":"2","weightKg":181},{"tagId":"3","weightKg":183},{"tagId":"4","weightKg":185},{"tagId":"5","weightKg":180},{"tagId":"6","weightKg":179}]',''),
    (v_lot3,'2024-08','[{"tagId":"1","weightKg":188},{"tagId":"2","weightKg":193},{"tagId":"3","weightKg":192},{"tagId":"4","weightKg":189},{"tagId":"5","weightKg":194},{"tagId":"6","weightKg":192}]',''),
    (v_lot3,'2024-09','[{"tagId":"1","weightKg":199},{"tagId":"2","weightKg":194},{"tagId":"3","weightKg":199},{"tagId":"4","weightKg":195},{"tagId":"5","weightKg":198},{"tagId":"6","weightKg":200}]',''),

    -- Rodeo 1 Machos
    (v_lot4,'2026-04','[{"tagId":"05","weightKg":215},{"tagId":"23","weightKg":210},{"tagId":"43","weightKg":190},{"tagId":"6","weightKg":180},{"tagId":"2","weightKg":208},{"tagId":"50","weightKg":207},{"tagId":"44","weightKg":195},{"tagId":"42","weightKg":193},{"tagId":"31","weightKg":205},{"tagId":"29","weightKg":208}]',''),
    (v_lot4,'2026-05','[{"tagId":"04","weightKg":215},{"tagId":"","weightKg":223},{"tagId":"","weightKg":230},{"tagId":"","weightKg":222},{"tagId":"","weightKg":234},{"tagId":"","weightKg":218},{"tagId":"","weightKg":213},{"tagId":"","weightKg":228},{"tagId":"","weightKg":230},{"tagId":"","weightKg":227}]','');

  RAISE NOTICE 'Sample data loaded successfully for user %', v_user_id;
END;
$$;
