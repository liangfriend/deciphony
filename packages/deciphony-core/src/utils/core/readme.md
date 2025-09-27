midi -> noteName -> region
region -> noteName -> midi

solmization -> noteName -> midi
midi -> noteName -> solmization

midi和region、solization和midi,直接转换太过复杂，所以进行二次转换

所以这里涉及6个核心算法

计算谱号所携带的变音符号， 第7算法

midi -> solmization
midi -> noteName
midi -> region

solmization -> midi
noteName -> midi
region -> midi